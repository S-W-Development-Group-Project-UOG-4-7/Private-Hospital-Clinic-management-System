<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
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
        ]);

        $query = Slot::query()
            ->with(['doctor:id,first_name,last_name,department_id'])
            ->whereDate('date', $validated['date']);

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

        $slots = $query
            ->orderBy('date')
            ->orderBy('start_time')
            ->get();

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

            if (Appointment::hasOverlap((int) $slot->doctor_id, $scheduledStart, $scheduledEnd)) {
                return response()->json(['message' => 'Selected doctor is not available at the chosen time.'], 422);
            }

            $bookingChannel = $validated['booking_channel'] ?? Appointment::BOOKING_CHANNEL_PATIENT_PORTAL;

            $appointment = Appointment::create([
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

            return response()->json([
                'appointment' => $appointment->load(['doctor:id,first_name,last_name,email', 'department:id,name']),
            ], 201);
        });
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
