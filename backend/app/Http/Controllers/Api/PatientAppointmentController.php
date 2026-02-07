<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\QueueEntry;
use App\Services\ConsultationFeeService;
use App\Services\TelemedSessionService;
use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class PatientAppointmentController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        $appointments = Appointment::query()
            ->where('patient_id', $user->id)
            ->with(['doctor:id,first_name,last_name,email'])
            ->orderBy('appointment_date', 'desc')
            ->orderBy('appointment_time', 'desc')
            ->get();

        return response()->json([
            'data' => $appointments,
        ]);
    }

    public function store(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'clinic_id' => ['nullable', 'integer', 'exists:clinics,id'],
            'department_id' => ['nullable', 'integer', 'exists:departments,id'],
            'doctor_id' => ['nullable', 'integer', 'exists:users,id'],
            'appointment_date' => ['required', 'date'],
            'appointment_time' => ['required'],
            'visit_mode' => ['nullable', Rule::in([Appointment::VISIT_MODE_PHYSICAL, Appointment::VISIT_MODE_ONLINE])],
            'type' => ['nullable', Rule::in(['in_person', 'telemedicine'])],
            'reason' => ['nullable', 'string', 'max:500'],
            'payment_method' => ['nullable', 'string', 'max:50'],
        ]);

        // Determine effective clinic
        $clinicId = $validated['clinic_id'] ?? null;

        // If doctor provided and clinic not provided, prefer doctor's clinic
        if (empty($clinicId) && ! empty($validated['doctor_id'])) {
            $doc = \App\Models\User::find($validated['doctor_id']);
            if ($doc && ! empty($doc->clinic_id)) {
                $clinicId = $doc->clinic_id;
            }
        }

        // If still not found, fallback to OPD clinic (case-insensitive name match)
        if (empty($clinicId)) {
            $opd = \App\Models\Clinic::query()
                ->whereRaw('LOWER(name) = ?', [strtolower('OPD')])
                ->first();
            if ($opd) {
                $clinicId = $opd->id;
            }
        }

        $clinic = null;
        if (! empty($clinicId)) {
            $clinic = \App\Models\Clinic::find($clinicId);
            if (! $clinic) {
                return response()->json(['message' => 'Clinic not found'], 404);
            }
        }

        $scheduledStart = CarbonImmutable::parse($validated['appointment_date'] . ' ' . $validated['appointment_time']);
        $scheduledEnd = $scheduledStart->addMinutes(30);

        if ($scheduledStart->isPast()) {
            return response()->json(['message' => 'Cannot book a time slot in the past.'], 422);
        }

        $doctorId = $validated['doctor_id'] ?? null;
        $departmentId = $validated['department_id'] ?? null;

        $includeUnassigned = $clinic ? strtolower((string) ($clinic->name ?? '')) === 'opd' : false;

        $doctorQuery = \App\Models\User::query()
            ->whereHas('roles', fn ($q) => $q->where('name', 'doctor'));

        if ($clinicId) {
            if ($includeUnassigned) {
                $doctorQuery->where(function ($q) use ($clinicId) {
                    $q->where('clinic_id', $clinicId)->orWhereNull('clinic_id');
                });
            } else {
                $doctorQuery->where('clinic_id', $clinicId);
            }
        }

        if ($departmentId) {
            $doctorQuery->where('department_id', (int) $departmentId);
        }

        $candidateDoctors = $doctorQuery->get();

        if (! empty($doctorId)) {
            $doctor = $candidateDoctors->firstWhere('id', (int) $doctorId);
            if (! $doctor) {
                return response()->json(['message' => 'Selected doctor does not belong to the chosen clinic.'], 422);
            }
        }

        $appointment = DB::transaction(function () use (
            $user,
            $validated,
            $clinic,
            $clinicId,
            $candidateDoctors,
            $doctorId,
            $scheduledStart,
            $scheduledEnd
        ) {
            $selectedDoctorId = $doctorId ? (int) $doctorId : null;
            $selectedDoctor = null;

            $alreadyBookedForDay = Appointment::query()
                ->where('patient_id', $user->id)
                ->whereDate('appointment_date', $validated['appointment_date'])
                ->whereIn('status', Appointment::activeScheduleStatuses())
                ->lockForUpdate()
                ->exists();

            if ($alreadyBookedForDay) {
                return response()->json(['message' => 'You already have an appointment on this date.'], 409);
            }

            $bookingQuery = Appointment::query()
                ->whereIn('status', Appointment::blockingStatuses())
                ->whereDate('appointment_date', $validated['appointment_date'])
                ->where('appointment_time', $validated['appointment_time']);

            if ($clinicId) {
                $bookingQuery->where(function ($q) use ($clinicId, $clinic) {
                    $q->where('clinic_id', $clinicId);
                    if ($clinic) {
                        $q->orWhere(function ($sub) use ($clinic) {
                            $sub->whereNull('clinic_id')
                                ->whereRaw('LOWER(clinic) = ?', [strtolower((string) $clinic->name)]);
                        });
                    }
                });
            } elseif ($selectedDoctorId) {
                $bookingQuery->where('doctor_id', $selectedDoctorId);
            }

            $alreadyBooked = $bookingQuery->lockForUpdate()->exists();
            if ($alreadyBooked) {
                return response()->json(['message' => 'This time slot is already booked.'], 422);
            }

            if ($selectedDoctorId) {
                $conflict = Appointment::query()
                    ->where('doctor_id', $selectedDoctorId)
                    ->whereIn('status', Appointment::blockingStatuses())
                    ->whereNotNull('scheduled_start')
                    ->whereNotNull('scheduled_end')
                    ->where('scheduled_start', '<', $scheduledEnd)
                    ->where('scheduled_end', '>', $scheduledStart)
                    ->lockForUpdate()
                    ->exists();

                if ($conflict) {
                    return response()->json(['message' => 'Selected doctor is not available at the chosen time.'], 422);
                }

                $selectedDoctor = $candidateDoctors->firstWhere('id', $selectedDoctorId);
            } else {
                $doctorIds = $candidateDoctors->pluck('id')->filter()->values()->all();
                if (empty($doctorIds)) {
                    return response()->json(['message' => 'No doctors available in this clinic at the chosen time.'], 422);
                }

                $availableDoctorIds = collect($doctorIds)
                    ->filter(fn ($id) => ! Appointment::hasOverlap((int) $id, $scheduledStart, $scheduledEnd))
                    ->values()
                    ->all();

                if (empty($availableDoctorIds)) {
                    return response()->json(['message' => 'No doctors available in this clinic at the chosen time.'], 422);
                }

                $appointmentCounts = Appointment::query()
                    ->selectRaw('doctor_id, COUNT(*) as total')
                    ->whereIn('doctor_id', $availableDoctorIds)
                    ->whereDate('appointment_date', $validated['appointment_date'])
                    ->whereIn('status', Appointment::blockingStatuses())
                    ->groupBy('doctor_id')
                    ->pluck('total', 'doctor_id')
                    ->toArray();

                $selectedDoctorId = collect($availableDoctorIds)
                    ->sortBy(fn ($id) => $appointmentCounts[$id] ?? 0)
                    ->values()
                    ->first();

                $selectedDoctor = $candidateDoctors->firstWhere('id', $selectedDoctorId);
            }

            if (! $selectedDoctor) {
                return response()->json(['message' => 'No doctors available in this clinic at the chosen time.'], 422);
            }

            $visitMode = strtoupper(trim((string) ($validated['visit_mode'] ?? '')));
            if ($visitMode === '') {
                $visitMode = ($validated['type'] ?? null) === 'telemedicine'
                    ? Appointment::VISIT_MODE_ONLINE
                    : Appointment::VISIT_MODE_PHYSICAL;
            }

            $type = $visitMode === Appointment::VISIT_MODE_ONLINE ? 'telemedicine' : 'in_person';

            $doctorName = trim(($selectedDoctor->first_name ?? '') . ' ' . ($selectedDoctor->last_name ?? ''));
            $doctorName = $doctorName === '' ? null : $doctorName;

            (new ConsultationFeeService())->charge($user, [
                'doctor_name' => $doctorName,
                'date' => $validated['appointment_date'],
                'time' => $validated['appointment_time'],
            ], $validated['payment_method'] ?? null);

            $created = Appointment::createWithNumberForDate($validated['appointment_date'], [
                'patient_id' => $user->id,
                'clinic_id' => $clinicId ?? null,
                'doctor_id' => $selectedDoctorId,
                'department_id' => $selectedDoctor->department_id ?? null,
                'appointment_date' => $validated['appointment_date'],
                'appointment_time' => $validated['appointment_time'],
                'scheduled_start' => $scheduledStart,
                'scheduled_end' => $scheduledEnd,
                'type' => $type,
                'visit_mode' => $visitMode,
                'booking_channel' => Appointment::BOOKING_CHANNEL_PATIENT_PORTAL,
                'status' => Appointment::STATUS_CONFIRMED,
                'reason' => $validated['reason'] ?? null,
                'confirmed_at' => now(),
            ]);

            if ($visitMode === Appointment::VISIT_MODE_ONLINE) {
                (new TelemedSessionService())->createForAppointment($created);
            }

            return $created->load('doctor');
        });

        if ($appointment instanceof \Illuminate\Http\JsonResponse) {
            return $appointment;
        }

        $this->ensureQueueEntry($appointment, $user?->id);

        return response()->json($appointment, 201);
    }

    public function show(Request $request, int $id)
    {
        $user = $request->user();

        $appointment = Appointment::query()
            ->where('patient_id', $user->id)
            ->with(['doctor:id,first_name,last_name,email'])
            ->findOrFail($id);

        return response()->json($appointment);
    }

    public function update(Request $request, int $id)
    {
        $user = $request->user();

        $appointment = Appointment::query()
            ->where('patient_id', $user->id)
            ->findOrFail($id);

        $validated = $request->validate([
            'clinic_id' => ['nullable', 'integer', 'exists:clinics,id'],
            'doctor_id' => ['nullable', 'integer', 'exists:users,id'],
            'appointment_date' => ['sometimes', 'date'],
            'appointment_time' => ['sometimes'],
            'visit_mode' => ['sometimes', Rule::in([Appointment::VISIT_MODE_PHYSICAL, Appointment::VISIT_MODE_ONLINE])],
            'type' => ['sometimes', Rule::in(['in_person', 'telemedicine'])],
            'status' => ['sometimes', Rule::in([Appointment::STATUS_CANCELLED, 'cancelled'])],
            'reason' => ['nullable', 'string', 'max:500'],
        ]);

        if (! empty($validated['clinic_id']) && ! empty($validated['doctor_id'])) {
            $doctor = \App\Models\User::find($validated['doctor_id']);
            if (! $doctor || (int) $doctor->clinic_id !== (int) $validated['clinic_id']) {
                return response()->json(['message' => 'Selected doctor does not belong to the chosen clinic.'], 422);
            }
        }

        if (array_key_exists('status', $validated)) {
            $validated['status'] = Appointment::normalizeStatus($validated['status']);
        }

        $nextDate = $validated['appointment_date'] ?? $appointment->appointment_date;
        $nextTime = $validated['appointment_time'] ?? $appointment->appointment_time;
        $nextDoctor = $validated['doctor_id'] ?? $appointment->doctor_id;
        $nextClinicId = $validated['clinic_id'] ?? $appointment->clinic_id;
        $nextStatus = $validated['status'] ?? $appointment->status;

        if ($nextDate && $nextTime && in_array($nextStatus, Appointment::blockingStatuses(), true)) {
            $clinic = null;
            if (! empty($nextClinicId)) {
                $clinic = \App\Models\Clinic::find($nextClinicId);
            }

            $slotConflictQuery = Appointment::query()
                ->whereIn('status', Appointment::blockingStatuses())
                ->where('id', '!=', $appointment->id)
                ->whereDate('appointment_date', $nextDate)
                ->where('appointment_time', $nextTime);

            if (! empty($nextClinicId)) {
                $slotConflictQuery->where(function ($q) use ($nextClinicId, $clinic) {
                    $q->where('clinic_id', $nextClinicId);
                    if ($clinic) {
                        $q->orWhere(function ($sub) use ($clinic) {
                            $sub->whereNull('clinic_id')
                                ->whereRaw('LOWER(clinic) = ?', [strtolower((string) $clinic->name)]);
                        });
                    }
                });
            } elseif (! empty($nextDoctor)) {
                $slotConflictQuery->where('doctor_id', (int) $nextDoctor);
            }

            if ($slotConflictQuery->exists()) {
                return response()->json(['message' => 'This time slot is already booked.'], 422);
            }
        }

        if ($nextDate && $nextTime && $nextDoctor) {
            $scheduledStart = CarbonImmutable::parse($nextDate . ' ' . $nextTime);
            $scheduledEnd = $scheduledStart->addMinutes(30);

            if (Appointment::hasOverlap((int) $nextDoctor, $scheduledStart, $scheduledEnd, $appointment->id)) {
                return response()->json(['message' => 'Selected doctor is not available at the chosen time.'], 422);
            }

            $validated['scheduled_start'] = $scheduledStart;
            $validated['scheduled_end'] = $scheduledEnd;
        }

        $visitMode = strtoupper(trim((string) ($validated['visit_mode'] ?? $appointment->visit_mode ?? '')));
        if ($visitMode === '') {
            $type = $validated['type'] ?? $appointment->type;
            $visitMode = $type === 'telemedicine' ? Appointment::VISIT_MODE_ONLINE : Appointment::VISIT_MODE_PHYSICAL;
        }
        $validated['visit_mode'] = $visitMode;
        if (array_key_exists('type', $validated) || empty($appointment->type)) {
            $validated['type'] = $visitMode === Appointment::VISIT_MODE_ONLINE ? 'telemedicine' : 'in_person';
        }

        $appointment->update($validated);

        if ($appointment->visit_mode === Appointment::VISIT_MODE_ONLINE && $appointment->status !== Appointment::STATUS_REQUESTED) {
            (new TelemedSessionService())->createForAppointment($appointment);
        } elseif ($appointment->videoSession) {
            $appointment->videoSession->delete();
        }

        return response()->json($appointment->load('doctor'));
    }

    public function destroy(Request $request, int $id)
    {
        $user = $request->user();

        return DB::transaction(function () use ($user, $id) {
            $appointment = Appointment::query()
                ->where('patient_id', $user->id)
                ->findOrFail($id);

            QueueEntry::query()
                ->where('appointment_id', $appointment->id)
                ->delete();

            $appointment->delete();

            return response()->json([
                'message' => 'Appointment deleted successfully',
            ]);
        });
    }

    public function cancel(Request $request, int $id)
    {
        $user = $request->user();

        $appointment = Appointment::query()
            ->where('patient_id', $user->id)
            ->findOrFail($id);

        $appointment->status = Appointment::STATUS_CANCELLED;
        $appointment->save();

        return response()->json(['message' => 'Appointment cancelled successfully.']);
    }

    public function reschedule(Request $request, int $id)
    {
        $user = $request->user();

        $validated = $request->validate([
            'slot_id' => ['required', 'integer', 'exists:slots,id'],
            'reason' => ['nullable', 'string', 'max:500'],
        ]);

        return DB::transaction(function () use ($user, $id, $validated) {
            $appointment = Appointment::query()
                ->where('patient_id', $user->id)
                ->lockForUpdate()
                ->findOrFail($id);

            $slot = \App\Models\Slot::query()->lockForUpdate()->findOrFail((int) $validated['slot_id']);

            if ($slot->status === 'BOOKED') {
                return response()->json(['message' => 'Slot already booked.'], 409);
            }

            if ($slot->status === 'HELD' && (int) $slot->held_by_patient_id !== (int) $user->id) {
                return response()->json(['message' => 'Slot is temporarily held by another patient.'], 409);
            }

            if ($slot->status === 'HELD' && $slot->isHoldExpired()) {
                $slot->status = 'AVAILABLE';
                $slot->held_by_patient_id = null;
                $slot->held_until = null;
                $slot->save();
            }

            $scheduledStart = CarbonImmutable::parse($slot->date->format('Y-m-d') . ' ' . $slot->start_time);
            $scheduledEnd = CarbonImmutable::parse($slot->date->format('Y-m-d') . ' ' . $slot->end_time);

            $alreadyBookedForDay = Appointment::query()
                ->where('patient_id', $user->id)
                ->where('id', '!=', $appointment->id)
                ->whereDate('appointment_date', $slot->date->format('Y-m-d'))
                ->whereIn(DB::raw('UPPER(status)'), Appointment::activeScheduleStatuses())
                ->exists();

            if ($alreadyBookedForDay) {
                return response()->json(['message' => 'You already have an appointment on this date.'], 409);
            }

            if (Appointment::hasOverlap((int) $slot->doctor_id, $scheduledStart, $scheduledEnd, $appointment->id)) {
                return response()->json(['message' => 'Selected doctor is not available at the chosen time.'], 422);
            }

            $doctor = \App\Models\User::query()->find($slot->doctor_id);

            $appointment->update([
                'doctor_id' => $slot->doctor_id,
                'department_id' => $doctor?->department_id,
                'clinic_id' => $doctor?->clinic_id,
                'appointment_date' => $slot->date->format('Y-m-d'),
                'appointment_time' => $slot->start_time,
                'scheduled_start' => $scheduledStart,
                'scheduled_end' => $scheduledEnd,
                'visit_mode' => Appointment::VISIT_MODE_PHYSICAL,
                'type' => 'in_person',
                'booking_channel' => Appointment::BOOKING_CHANNEL_PATIENT_PORTAL,
                'status' => Appointment::STATUS_CONFIRMED,
                'reason' => $validated['reason'] ?? $appointment->reason,
                'confirmed_at' => now(),
            ]);

            $slot->status = 'BOOKED';
            $slot->held_until = null;
            $slot->held_by_patient_id = null;
            $slot->save();

            QueueEntry::query()
                ->where('appointment_id', $appointment->id)
                ->delete();

            $this->ensureQueueEntry($appointment, $user?->id);

            return response()->json([
                'appointment' => $appointment->load(['doctor:id,first_name,last_name,email', 'department:id,name']),
            ]);
        });
    }

    private function ensureQueueEntry(Appointment $appointment, ?int $createdByUserId = null): ?QueueEntry
    {
        if ($appointment->visit_mode !== Appointment::VISIT_MODE_PHYSICAL) {
            return null;
        }

        if (! in_array($appointment->status, Appointment::activeScheduleStatuses(), true)) {
            return null;
        }

        $queueDate = $appointment->appointment_date?->format('Y-m-d') ?? (string) $appointment->appointment_date;
        if ($queueDate === '') {
            return null;
        }

        $existing = QueueEntry::query()
            ->where('appointment_id', $appointment->id)
            ->whereDate('queue_date', $queueDate)
            ->first();

        if ($existing) {
            return $existing;
        }

        $doctorId = $appointment->doctor_id;

        $lastQueueNumber = QueueEntry::query()
            ->whereDate('queue_date', $queueDate)
            ->where(function ($q) use ($doctorId) {
                if ($doctorId) {
                    $q->where('doctor_id', $doctorId);
                } else {
                    $q->whereNull('doctor_id');
                }
            })
            ->orderByDesc('queue_number')
            ->lockForUpdate()
            ->value('queue_number');

        $nextQueueNumber = ((int) $lastQueueNumber) + 1;

        return QueueEntry::create([
            'appointment_id' => $appointment->id,
            'patient_id' => $appointment->patient_id,
            'doctor_id' => $doctorId,
            'queue_date' => $queueDate,
            'queue_number' => $nextQueueNumber,
            'status' => 'waiting',
            'priority' => 'normal',
            'checked_in_at' => null,
            'created_by' => $createdByUserId,
        ]);
    }
}
