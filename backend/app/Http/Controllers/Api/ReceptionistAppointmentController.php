<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\PatientProfile;
use App\Models\QueueEntry;
use App\Models\Slot;
use App\Models\User;
use App\Models\Department; // <--- ADDED IMPORT
use App\Services\TelemedSessionService;
use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class ReceptionistAppointmentController extends Controller
{
    public function index(Request $request)
    {
        $query = Appointment::query()
            ->with([
                'patient:id,first_name,last_name,email,username,is_active',
                'doctor:id,first_name,last_name,email,username,is_active',
                'department' // <--- ADDED: Include department details
            ]);

        if ($request->has('date')) {
            $query->whereDate('appointment_date', $request->get('date'));
        }

        if ($request->has('status')) {
            $query->where('status', Appointment::normalizeStatus($request->get('status')));
        }

        if ($request->has('patient_id')) {
            $query->where('patient_id', (int) $request->get('patient_id'));
        }

        if ($request->has('doctor_id')) {
            $query->where('doctor_id', (int) $request->get('doctor_id'));
        }

        // <--- ADDED: Filter by Department if needed
        if ($request->has('department_id')) {
            $query->where('department_id', (int) $request->get('department_id'));
        }

        $appointments = $query
            ->orderBy('appointment_date', 'desc')
            ->orderBy('appointment_time', 'desc')
            ->paginate((int) ($request->get('per_page') ?: 20));

        return response()->json($appointments);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'patient_id' => ['nullable', 'max:50', 'required_without:patient_code'],
            'patient_code' => ['nullable', 'string', 'max:50', 'required_without:patient_id'],
            'slot_id' => ['nullable', 'integer', 'exists:slots,id'],
            'doctor_id' => ['nullable', 'integer', 'exists:users,id'],
            'department_id' => ['required', 'integer', 'exists:departments,id'],
            'appointment_date' => ['required_without:slot_id', 'date'],
            'appointment_time' => ['required_without:slot_id'],
            'visit_mode' => ['nullable', Rule::in([Appointment::VISIT_MODE_PHYSICAL, Appointment::VISIT_MODE_ONLINE])],
            'type' => ['nullable', Rule::in(['in_person', 'telemedicine'])],
            'status' => ['nullable', Rule::in([
                'scheduled', 'completed', 'cancelled',
                Appointment::STATUS_REQUESTED,
                Appointment::STATUS_CONFIRMED,
                Appointment::STATUS_CHECKED_IN,
                Appointment::STATUS_IN_PROGRESS,
                Appointment::STATUS_COMPLETED,
                Appointment::STATUS_CANCELLED,
                Appointment::STATUS_NO_SHOW,
            ])],
            'is_walk_in' => ['nullable', 'boolean'],
            'reason' => ['nullable', 'string'], // Added reason
            'notes' => ['nullable', 'string'],   // Added notes
        ]);

        $patientId = null;
        $patientCode = trim((string) ($validated['patient_code'] ?? ''));
        $rawPatientIdOrCode = trim((string) ($validated['patient_id'] ?? ''));

        // --- PATIENT LOOKUP LOGIC (Kept exactly as you had it) ---
        if ($patientCode !== '') {
            $profile = PatientProfile::query()
                ->where('patient_id', $patientCode)
                ->with('user')
                ->first();

            if (! $profile || ! $profile->user) {
                return response()->json(['message' => 'Patient not found for provided patient code.'], 422);
            }
            $patientId = $profile->user->id;
        } elseif ($rawPatientIdOrCode !== '') {
            $profile = PatientProfile::query()
                ->where('patient_id', $rawPatientIdOrCode)
                ->with('user')
                ->first();

            if ($profile && $profile->user) {
                $patientId = $profile->user->id;
            } elseif (ctype_digit($rawPatientIdOrCode) && User::query()->whereKey((int) $rawPatientIdOrCode)->exists()) {
                $patientId = (int) $rawPatientIdOrCode;
            } else {
                return response()->json(['message' => 'Patient not found for provided patient id.'], 422);
            }
        }

        if (empty($patientId)) {
            return response()->json(['message' => 'Patient not found for provided patient id.'], 422);
        }

        $isWalkIn = (bool) ($validated['is_walk_in'] ?? false);

        return DB::transaction(function () use ($validated, $patientId, $isWalkIn, $request) {
            $status = Appointment::normalizeStatus($validated['status'] ?? Appointment::STATUS_CONFIRMED);
            $departmentId = $validated['department_id'];

            $doctorId = $validated['doctor_id'] ?? null;

            $visitMode = strtoupper(trim((string) ($validated['visit_mode'] ?? '')));
            if ($visitMode === '') {
                $visitMode = ($validated['type'] ?? null) === 'telemedicine'
                    ? Appointment::VISIT_MODE_ONLINE
                    : Appointment::VISIT_MODE_PHYSICAL;
            }

            $slot = null;
            if (! empty($validated['slot_id'])) {
                $slot = Slot::query()->lockForUpdate()->findOrFail((int) $validated['slot_id']);

                if ($slot->status === 'BOOKED') {
                    return response()->json([
                        'message' => 'Selected slot is already booked.',
                    ], 422);
                }

                if ($slot->status === 'HELD' && $slot->isHoldExpired()) {
                    $slot->status = 'AVAILABLE';
                    $slot->held_by_patient_id = null;
                    $slot->held_until = null;
                    $slot->save();
                }

                if ($slot->status === 'HELD' && ! $slot->isHoldExpired() && $slot->held_by_patient_id) {
                    return response()->json([
                        'message' => 'Selected slot is currently held by a patient.',
                    ], 422);
                }

                $appointmentDate = $slot->date->format('Y-m-d');
                $appointmentTime = $slot->start_time;
                $doctorId = $slot->doctor_id;
            } else {
                $appointmentDate = $validated['appointment_date'];
                $appointmentTime = $validated['appointment_time'];
            }

            $scheduledStart = CarbonImmutable::parse($appointmentDate . ' ' . $appointmentTime);
            $scheduledEnd = $scheduledStart->addMinutes(30);

            if ($scheduledStart->isPast()) {
                return response()->json([
                    'message' => 'Cannot book a time slot in the past.',
                ], 422);
            }

            if (in_array($status, Appointment::blockingStatuses(), true)) {
                $clinicName = 'OPD';
                $clinicId = \App\Models\Clinic::query()
                    ->whereRaw('LOWER(name) = ?', [strtolower($clinicName)])
                    ->value('id');

                $slotConflict = Appointment::query()
                    ->whereIn('status', Appointment::blockingStatuses())
                    ->whereDate('appointment_date', $appointmentDate)
                    ->where('appointment_time', $appointmentTime)
                    ->where(function ($q) use ($clinicId, $clinicName) {
                        if ($clinicId) {
                            $q->where('clinic_id', $clinicId);
                        }
                        $q->orWhere(function ($sub) use ($clinicName) {
                            $sub->whereNull('clinic_id')
                                ->whereRaw('LOWER(clinic) = ?', [strtolower($clinicName)]);
                        });
                    })
                    ->lockForUpdate()
                    ->exists();

                if ($slotConflict) {
                    return response()->json([
                        'message' => 'Time slot already booked for this department.',
                    ], 422);
                }
            }

            if (! empty($doctorId)) {
                $doctor = User::query()->role('doctor')->whereKey($doctorId)->first();
                if (! $doctor || (int) $doctor->department_id !== (int) $departmentId) {
                    return response()->json([
                        'message' => 'Selected doctor does not belong to the chosen department.',
                    ], 422);
                }
            }

            if ($slot && $visitMode !== '' && ! $this->slotAllowsVisitMode($slot, $visitMode)) {
                return response()->json([
                    'message' => 'Selected slot does not support the chosen visit mode.',
                ], 422);
            }

            if (! empty($doctorId) && in_array($status, Appointment::blockingStatuses(), true)) {
                $conflict = Appointment::query()
                    ->where('doctor_id', $doctorId)
                    ->whereIn('status', Appointment::blockingStatuses())
                    ->whereNotNull('scheduled_start')
                    ->whereNotNull('scheduled_end')
                    ->where('scheduled_start', '<', $scheduledEnd)
                    ->where('scheduled_end', '>', $scheduledStart)
                    ->lockForUpdate()
                    ->exists();

                if ($conflict) {
                    return response()->json([
                        'message' => 'Appointment conflict: doctor is already booked for this time slot.',
                    ], 422);
                }
            }

            if (empty($doctorId) && in_array($status, Appointment::blockingStatuses(), true)) {
                $doctorIds = User::query()
                    ->role('doctor')
                    ->where('department_id', $departmentId)
                    ->where('is_active', true)
                    ->pluck('id');

                if ($doctorIds->isEmpty()) {
                    return response()->json([
                        'message' => 'No doctors available for the selected department.',
                    ], 422);
                }

                $conflictedDoctorIds = Appointment::query()
                    ->whereIn('doctor_id', $doctorIds)
                    ->whereIn('status', Appointment::blockingStatuses())
                    ->whereNotNull('scheduled_start')
                    ->whereNotNull('scheduled_end')
                    ->where('scheduled_start', '<', $scheduledEnd)
                    ->where('scheduled_end', '>', $scheduledStart)
                    ->pluck('doctor_id')
                    ->unique()
                    ->values()
                    ->toArray();

                $appointmentCounts = Appointment::query()
                    ->selectRaw('doctor_id, COUNT(*) as total')
                    ->whereIn('doctor_id', $doctorIds)
                    ->whereDate('appointment_date', $appointmentDate)
                    ->whereIn('status', Appointment::blockingStatuses())
                    ->groupBy('doctor_id')
                    ->pluck('total', 'doctor_id')
                    ->toArray();

                $availableDoctorIds = $doctorIds->filter(fn ($id) => ! in_array($id, $conflictedDoctorIds, true));

                if ($availableDoctorIds->isEmpty()) {
                    return response()->json([
                        'message' => 'No doctors available at the selected time.',
                    ], 422);
                }

                $doctorId = $availableDoctorIds
                    ->sortBy(fn ($id) => $appointmentCounts[$id] ?? 0)
                    ->values()
                    ->first();
            }

            // --- APPOINTMENT NUMBER LOCKING (Kept as is) ---
            // --- CREATE APPOINTMENT ---
            $appointment = Appointment::createWithNumberForDate($appointmentDate, [
                'patient_id' => $patientId,
                'doctor_id' => $doctorId,
                'department_id' => $departmentId,
                'clinic' => 'OPD',
                'appointment_date' => $appointmentDate,
                'appointment_time' => $appointmentTime,
                'scheduled_start' => $scheduledStart,
                'scheduled_end' => $scheduledEnd,
                'type' => $visitMode === Appointment::VISIT_MODE_ONLINE ? 'telemedicine' : 'in_person',
                'visit_mode' => $visitMode,
                'booking_channel' => Appointment::BOOKING_CHANNEL_FRONTDESK,
                'status' => $status,
                'is_walk_in' => $isWalkIn,
                'reason' => $validated['reason'] ?? null,
                'notes' => $validated['notes'] ?? null,
                'confirmed_at' => $status === Appointment::STATUS_CONFIRMED ? now() : null,
            ]);

            if ($visitMode === Appointment::VISIT_MODE_ONLINE && $status !== Appointment::STATUS_REQUESTED) {
                (new TelemedSessionService())->createForAppointment($appointment);
            }

            if ($slot) {
                $slot->status = 'BOOKED';
                $slot->held_until = null;
                $slot->held_by_patient_id = null;
                $slot->save();
            }

            // --- QUEUE GENERATION (Kept as is) ---
            $queueEntry = null;
            if ($visitMode === Appointment::VISIT_MODE_PHYSICAL && in_array($status, Appointment::activeScheduleStatuses(), true)) {
                $queueDate = $appointmentDate;
                $queueEntry = QueueEntry::query()
                    ->where('appointment_id', $appointment->id)
                    ->whereDate('queue_date', $queueDate)
                    ->first();

                if (! $queueEntry) {
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

                    $nextQueueNumber = ((int) ($lastQueueNumber ?? 0)) + 1;

                    $queueEntry = QueueEntry::create([
                        'appointment_id' => $appointment->id,
                        'patient_id' => $patientId,
                        'doctor_id' => $doctorId,
                        'queue_date' => $queueDate,
                        'queue_number' => $nextQueueNumber,
                        'status' => 'waiting',
                        'priority' => 'normal',
                        'checked_in_at' => now(),
                        'created_by' => $request->user()?->id,
                    ]);
                }
            }

            return response()->json([
                'appointment' => $appointment->load(['patient', 'doctor', 'department']),
                'queue_entry' => $queueEntry?->load(['patient', 'doctor', 'appointment']),
            ], 201);
        });
    }

    public function show(int $id)
    {
        $appointment = Appointment::query()
            ->with([
                'patient:id,first_name,last_name,email,username,is_active',
                'doctor:id,first_name,last_name,email,username,is_active',
                'department'
            ])
            ->findOrFail($id);

        return response()->json($appointment);
    }

    public function update(Request $request, int $id)
    {
        $appointment = Appointment::findOrFail($id);

        $validated = $request->validate([
            'patient_id' => ['sometimes', 'max:50'],
            'doctor_id' => ['nullable', 'integer', 'exists:users,id'],
            'department_id' => ['nullable', 'integer', 'exists:departments,id'], // <--- ADDED VALIDATION
            'appointment_date' => ['sometimes', 'date'],
            'appointment_time' => ['sometimes'],
            'visit_mode' => ['sometimes', Rule::in([Appointment::VISIT_MODE_PHYSICAL, Appointment::VISIT_MODE_ONLINE])],
            'type' => ['sometimes', Rule::in(['in_person', 'telemedicine'])],
            'status' => ['sometimes', Rule::in([
                'scheduled', 'completed', 'cancelled',
                Appointment::STATUS_REQUESTED,
                Appointment::STATUS_CONFIRMED,
                Appointment::STATUS_CHECKED_IN,
                Appointment::STATUS_IN_PROGRESS,
                Appointment::STATUS_COMPLETED,
                Appointment::STATUS_CANCELLED,
                Appointment::STATUS_NO_SHOW,
            ])],
            'reason' => ['nullable', 'string'],
            'notes' => ['nullable', 'string'],
        ]);

        if (empty($appointment->clinic)) {
            $appointment->clinic = 'OPD';
        }

        // --- PATIENT ID UPDATE LOGIC (Kept as is) ---
        if (array_key_exists('patient_id', $validated)) {
            $patientId = null;
            $rawPatientIdOrCode = trim((string) ($validated['patient_id'] ?? ''));

            if ($rawPatientIdOrCode === '') {
                return response()->json(['message' => 'Patient id is required.'], 422);
            }

            if (ctype_digit($rawPatientIdOrCode) && User::query()->whereKey((int) $rawPatientIdOrCode)->exists()) {
                $patientId = (int) $rawPatientIdOrCode;
            } else {
                $profile = PatientProfile::query()
                    ->where('patient_id', $rawPatientIdOrCode)
                    ->with('user')
                    ->first();

                if (! $profile || ! $profile->user) {
                    return response()->json(['message' => 'Patient not found for provided patient id.'], 422);
                }
                $patientId = $profile->user->id;
            }
            $validated['patient_id'] = $patientId;
        }

        // --- CONFLICT CHECK (Kept as is) ---
        if (array_key_exists('status', $validated)) {
            $validated['status'] = Appointment::normalizeStatus($validated['status']);
        }

        $nextDoctorId = array_key_exists('doctor_id', $validated) ? $validated['doctor_id'] : $appointment->doctor_id;
        $nextDepartmentId = array_key_exists('department_id', $validated) ? $validated['department_id'] : $appointment->department_id;
        $nextDate = $validated['appointment_date'] ?? $appointment->appointment_date;
        $nextTime = $validated['appointment_time'] ?? $appointment->appointment_time;
        $nextStatus = $validated['status'] ?? $appointment->status;

        if ($nextDate && $nextTime && in_array($nextStatus, Appointment::blockingStatuses(), true)) {
            $clinicName = strtolower((string) ($appointment->clinic ?? 'OPD'));
            $clinicId = \App\Models\Clinic::query()
                ->whereRaw('LOWER(name) = ?', [$clinicName])
                ->value('id');

            $slotConflict = Appointment::query()
                ->whereIn('status', Appointment::blockingStatuses())
                ->where('id', '!=', $appointment->id)
                ->whereDate('appointment_date', $nextDate)
                ->where('appointment_time', $nextTime)
                ->where(function ($q) use ($clinicId, $clinicName) {
                    if ($clinicId) {
                        $q->where('clinic_id', $clinicId);
                    }
                    $q->orWhere(function ($sub) use ($clinicName) {
                        $sub->whereNull('clinic_id')
                            ->whereRaw('LOWER(clinic) = ?', [$clinicName]);
                    });
                })
                ->exists();

            if ($slotConflict) {
                return response()->json([
                    'message' => 'Time slot already booked for this department.',
                ], 422);
            }

            $validated['scheduled_start'] = CarbonImmutable::parse($nextDate . ' ' . $nextTime);
            $validated['scheduled_end'] = CarbonImmutable::parse($nextDate . ' ' . $nextTime)->addMinutes(30);
        }

        if (! empty($nextDoctorId) && in_array($nextStatus, Appointment::blockingStatuses(), true)) {
            $scheduledStart = CarbonImmutable::parse($nextDate . ' ' . $nextTime);
            $scheduledEnd = $scheduledStart->addMinutes(30);

            $conflict = Appointment::hasOverlap((int) $nextDoctorId, $scheduledStart, $scheduledEnd, $appointment->id);

            if ($conflict) {
                return response()->json([
                    'message' => 'Appointment conflict: doctor is already booked for this time slot.',
                ], 422);
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

        if ($appointment->status === Appointment::STATUS_CONFIRMED && $appointment->confirmed_at === null) {
            $appointment->confirmed_at = now();
            $appointment->save();
        }

        if ($appointment->visit_mode === Appointment::VISIT_MODE_ONLINE && $appointment->status !== Appointment::STATUS_REQUESTED) {
            (new TelemedSessionService())->createForAppointment($appointment);
        } elseif ($appointment->videoSession) {
            $appointment->videoSession->delete();
        }

        return response()->json($appointment->fresh()->load(['patient', 'doctor', 'department']));
    }

    public function confirm(int $id)
    {
        $appointment = Appointment::findOrFail($id);

        if ($appointment->status !== Appointment::STATUS_REQUESTED) {
            return response()->json([
                'message' => 'Only requested appointments can be confirmed.',
            ], 422);
        }

        if ($appointment->confirmed_at !== null) {
            return response()->json($appointment->load(['patient', 'doctor', 'department']));
        }

        $appointment->confirmed_at = now();
        $appointment->status = Appointment::STATUS_CONFIRMED;
        $appointment->save();

        if ($appointment->visit_mode === Appointment::VISIT_MODE_ONLINE) {
            (new TelemedSessionService())->createForAppointment($appointment);
        }

        return response()->json($appointment->fresh()->load(['patient', 'doctor', 'department']));
    }

    public function destroy(int $id)
    {
        return DB::transaction(function () use ($id) {
            $appointment = Appointment::findOrFail($id);

            QueueEntry::query()
                ->where('appointment_id', $appointment->id)
                ->delete();

            $appointment->delete();

            return response()->json([
                'message' => 'Appointment deleted successfully',
            ]);
        });
    }

    private function slotAllowsVisitMode(Slot $slot, string $visitMode): bool
    {
        $allowed = strtoupper((string) ($slot->allowed_visit_mode ?? ''));

        if ($allowed === '' || $allowed === 'BOTH') {
            return true;
        }

        return $allowed === strtoupper($visitMode);
    }
}
