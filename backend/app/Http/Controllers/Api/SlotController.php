<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\QueueEntry;
use App\Models\Slot;
use App\Models\User;
use App\Services\TelemedSessionService;
use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class SlotController extends Controller
{
    public function index(Request $request)
    {
        Slot::query()
            ->where('status', 'HELD')
            ->whereNotNull('held_until')
            ->where('held_until', '<', now())
            ->update([
                'status' => 'AVAILABLE',
                'held_until' => null,
                'held_by_patient_id' => null,
            ]);

        $validated = $request->validate([
            'department_id' => ['nullable', 'integer', 'exists:departments,id'],
            'doctor_id' => ['nullable', 'integer', 'exists:users,id'],
            'date' => ['required', 'date'],
            'visit_mode' => ['nullable', Rule::in([Appointment::VISIT_MODE_PHYSICAL, Appointment::VISIT_MODE_ONLINE])],
            'available_only' => ['nullable', 'boolean'],
        ]);

        $availableOnly = filter_var($request->get('available_only', false), FILTER_VALIDATE_BOOLEAN);
        $user = $request->user();

        $query = Slot::query()
            ->with(['doctor:id,first_name,last_name,department_id'])
            ->whereDate('date', $validated['date']);

        // Prevent showing past slots for today
        if (CarbonImmutable::parse($validated['date'])->isSameDay(now())) {
            $query->whereRaw('(slots.date + slots.start_time) > ?', [now()->toDateTimeString()]);
        }

        if (! empty($validated['doctor_id'])) {
            $query->where('doctor_id', (int) $validated['doctor_id']);
        }

        if (! empty($validated['department_id'])) {
            $departmentId = (int) $validated['department_id'];
            $query->whereHas('doctor', function ($q) use ($departmentId) {
                $q->where('department_id', $departmentId);
            });
        }

        if (! empty($validated['visit_mode'])) {
            $visitMode = strtoupper($validated['visit_mode']);
            $query->whereIn('allowed_visit_mode', ['BOTH', $visitMode]);
        }

        if ($availableOnly) {
            $query->where(function ($q) use ($user) {
                $q->where('status', 'AVAILABLE');
                if ($user) {
                    $q->orWhere(function ($sub) use ($user) {
                        $sub->where('status', 'HELD')
                            ->where('held_by_patient_id', $user->id)
                            ->where(function ($held) {
                                $held->whereNull('held_until')->orWhere('held_until', '>=', now());
                            });
                    });
                }
            });

            $query->whereNotExists(function ($sub) {
                $sub->selectRaw('1')
                    ->from('appointments')
                    ->whereColumn('appointments.doctor_id', 'slots.doctor_id')
                    ->whereIn(DB::raw('UPPER(appointments.status)'), Appointment::activeScheduleStatuses())
                    ->where(function ($overlap) {
                        $overlap->where(function ($q) {
                            $q->whereNotNull('appointments.scheduled_start')
                                ->whereNotNull('appointments.scheduled_end')
                                ->whereRaw('appointments.scheduled_start < (slots.date + slots.end_time)')
                                ->whereRaw('appointments.scheduled_end > (slots.date + slots.start_time)');
                        })->orWhere(function ($q) {
                            $q->where(function ($nulls) {
                                $nulls->whereNull('appointments.scheduled_start')
                                    ->orWhereNull('appointments.scheduled_end');
                            })
                                ->whereNotNull('appointments.appointment_time')
                                ->whereRaw('appointments.appointment_date = slots.date')
                                ->whereRaw('appointments.appointment_time >= slots.start_time')
                                ->whereRaw('appointments.appointment_time < slots.end_time');
                        });
                    });
            });
        }

        $slots = $query
            ->orderBy('date')
            ->orderBy('start_time')
            ->get();

        if ($availableOnly && empty($validated['doctor_id']) && ! empty($validated['department_id'])) {
            $doctorIds = $slots->pluck('doctor_id')->unique()->filter()->values();
            $appointmentCounts = Appointment::query()
                ->selectRaw('doctor_id, COUNT(*) as total')
                ->whereIn('doctor_id', $doctorIds)
                ->whereDate('appointment_date', $validated['date'])
                ->whereIn(DB::raw('UPPER(status)'), Appointment::activeScheduleStatuses())
                ->groupBy('doctor_id')
                ->pluck('total', 'doctor_id')
                ->toArray();

            $slots = $slots
                ->groupBy('start_time')
                ->map(function ($group) use ($appointmentCounts) {
                    return $group
                        ->sortBy(function ($slot) use ($appointmentCounts) {
                            return $appointmentCounts[$slot->doctor_id] ?? 0;
                        })
                        ->first();
                })
                ->values();
        }

        return response()->json(['data' => $slots]);
    }

    public function hold(Request $request, int $slotId)
    {
        $user = $request->user();

        $validated = $request->validate([
            'visit_mode' => ['nullable', Rule::in([Appointment::VISIT_MODE_PHYSICAL, Appointment::VISIT_MODE_ONLINE])],
        ]);

        $visitMode = strtoupper((string) ($validated['visit_mode'] ?? ''));

        return DB::transaction(function () use ($slotId, $user, $visitMode) {
            $slot = Slot::query()->lockForUpdate()->findOrFail($slotId);

            if ($slot->status === 'BOOKED') {
                return response()->json(['message' => 'Slot already booked.'], 409);
            }

            if ($slot->status === 'HELD' && ! $slot->isHoldExpired() && (int) $slot->held_by_patient_id !== (int) $user->id) {
                return response()->json(['message' => 'Slot is temporarily held by another patient.'], 409);
            }

            if ($slot->status === 'HELD' && $slot->isHoldExpired()) {
                $slot->status = 'AVAILABLE';
                $slot->held_by_patient_id = null;
                $slot->held_until = null;
            }

            $scheduledStart = CarbonImmutable::parse($slot->date->format('Y-m-d') . ' ' . $slot->start_time);
            $scheduledEnd = CarbonImmutable::parse($slot->date->format('Y-m-d') . ' ' . $slot->end_time);

            if ($scheduledStart->isPast()) {
                return response()->json(['message' => 'Selected time has already passed.'], 422);
            }

            if (Appointment::hasOverlap((int) $slot->doctor_id, $scheduledStart, $scheduledEnd)) {
                return response()->json(['message' => 'Selected doctor is not available at the chosen time.'], 409);
            }

            if ($visitMode !== '' && ! $this->slotAllowsVisitMode($slot, $visitMode)) {
                return response()->json(['message' => 'Slot does not support the selected visit mode.'], 422);
            }

            $slot->status = 'HELD';
            $slot->held_by_patient_id = $user->id;
            $slot->held_until = now()->addMinutes(5);
            $slot->save();

            return response()->json($slot->fresh());
        });
    }

    public function confirm(Request $request, int $slotId)
    {
        $user = $request->user();

        $validated = $request->validate([
            'visit_mode' => ['required', Rule::in([Appointment::VISIT_MODE_PHYSICAL, Appointment::VISIT_MODE_ONLINE])],
            'booking_channel' => ['nullable', Rule::in([
                Appointment::BOOKING_CHANNEL_FRONTDESK,
                Appointment::BOOKING_CHANNEL_PATIENT_PORTAL,
                Appointment::BOOKING_CHANNEL_SYSTEM,
            ])],
            'reason' => ['nullable', 'string', 'max:500'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ]);

        return DB::transaction(function () use ($slotId, $user, $validated) {
            $slot = Slot::query()->lockForUpdate()->findOrFail($slotId);

            if ($slot->status !== 'HELD') {
                return response()->json(['message' => 'Slot must be held before confirmation.'], 409);
            }

            if ((int) $slot->held_by_patient_id !== (int) $user->id) {
                return response()->json(['message' => 'You do not hold this slot.'], 403);
            }

            if ($slot->held_until && CarbonImmutable::parse($slot->held_until)->isPast()) {
                return response()->json(['message' => 'Slot hold has expired.'], 409);
            }

            $visitMode = strtoupper($validated['visit_mode']);
            if (! $this->slotAllowsVisitMode($slot, $visitMode)) {
                return response()->json(['message' => 'Slot does not support the selected visit mode.'], 422);
            }

            $doctor = User::query()->whereKey($slot->doctor_id)->first();
            if (! $doctor) {
                return response()->json(['message' => 'Doctor not found for this slot.'], 404);
            }

            $scheduledStart = CarbonImmutable::parse($slot->date->format('Y-m-d') . ' ' . $slot->start_time);
            $scheduledEnd = CarbonImmutable::parse($slot->date->format('Y-m-d') . ' ' . $slot->end_time);

            if ($scheduledStart->isPast()) {
                return response()->json(['message' => 'Selected time has already passed.'], 422);
            }

            $alreadyBookedForDay = Appointment::query()
                ->where('patient_id', $user->id)
                ->whereDate('appointment_date', $slot->date->format('Y-m-d'))
                ->whereIn(DB::raw('UPPER(status)'), Appointment::activeScheduleStatuses())
                ->exists();

            if ($alreadyBookedForDay) {
                return response()->json(['message' => 'You already have an appointment on this date.'], 409);
            }

            if (Appointment::hasOverlap((int) $slot->doctor_id, $scheduledStart, $scheduledEnd)) {
                return response()->json(['message' => 'Selected doctor is not available at the chosen time.'], 422);
            }

            $bookingChannel = $validated['booking_channel'] ?? Appointment::BOOKING_CHANNEL_PATIENT_PORTAL;

            $appointment = Appointment::createWithNumberForDate($slot->date->format('Y-m-d'), [
                'patient_id' => $user->id,
                'doctor_id' => $slot->doctor_id,
                'department_id' => $doctor->department_id,
                'clinic_id' => $doctor->clinic_id,
                'appointment_date' => $slot->date->format('Y-m-d'),
                'appointment_time' => $slot->start_time,
                'scheduled_start' => $scheduledStart,
                'scheduled_end' => $scheduledEnd,
                'type' => $visitMode === Appointment::VISIT_MODE_ONLINE ? 'telemedicine' : 'in_person',
                'visit_mode' => $visitMode,
                'booking_channel' => $bookingChannel,
                'status' => Appointment::STATUS_CONFIRMED,
                'reason' => $validated['reason'] ?? null,
                'notes' => $validated['notes'] ?? null,
                'confirmed_at' => now(),
            ]);

            if ($visitMode === Appointment::VISIT_MODE_ONLINE) {
                (new TelemedSessionService())->createForAppointment($appointment);
            }

            $slot->status = 'BOOKED';
            $slot->held_until = null;
            $slot->held_by_patient_id = null;
            $slot->save();

            $this->ensureQueueEntry($appointment, $user?->id);

            return response()->json([
                'appointment' => $appointment->load(['doctor:id,first_name,last_name,email', 'department:id,name']),
            ], 201);
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

    private function slotAllowsVisitMode(Slot $slot, string $visitMode): bool
    {
        $allowed = strtoupper($slot->allowed_visit_mode ?? '');

        if ($allowed === 'BOTH') {
            return true;
        }

        return $allowed === $visitMode;
    }
}
