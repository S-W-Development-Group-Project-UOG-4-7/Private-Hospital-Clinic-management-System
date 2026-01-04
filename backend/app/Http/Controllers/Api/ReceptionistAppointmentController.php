<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\DoctorSchedule;
use App\Models\PatientProfile;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ReceptionistAppointmentController extends Controller
{
    public function index(Request $request)
    {
        $query = Appointment::query()
            ->with([
                'patient:id,first_name,last_name,email,username,is_active',
                'doctor:id,first_name,last_name,email,username,is_active',
            ]);

        if ($request->has('date')) {
            $query->whereDate('appointment_date', $request->get('date'));
        }

        if ($request->has('status')) {
            $query->where('status', $request->get('status'));
        }

        if ($request->has('patient_id')) {
            $query->where('patient_id', (int) $request->get('patient_id'));
        }

        if ($request->has('doctor_id')) {
            $query->where('doctor_id', (int) $request->get('doctor_id'));
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
            'doctor_id' => ['nullable', 'integer', 'exists:users,id'],
            'clinic' => ['nullable', 'string', 'max:100'],
            'appointment_date' => ['required', 'date'],
            'appointment_time' => ['required'],
            'type' => ['nullable', Rule::in(['in_person', 'telemedicine'])],
            'status' => ['nullable', Rule::in(['scheduled', 'completed', 'cancelled'])],
            'is_walk_in' => ['nullable', 'boolean'],
            'reason' => ['nullable', 'string', 'max:500'],
            'notes' => ['nullable', 'string'],
        ]);

        $patientId = null;

        $patientCode = trim((string) ($validated['patient_code'] ?? ''));
        $rawPatientIdOrCode = trim((string) ($validated['patient_id'] ?? ''));

        if ($patientCode !== '') {
            $profile = PatientProfile::query()
                ->where('patient_id', $patientCode)
                ->with('user')
                ->first();

            if (! $profile || ! $profile->user) {
                return response()->json([
                    'message' => 'Patient not found for provided patient code.',
                ], 422);
            }

            $patientId = $profile->user->id;
        } elseif ($rawPatientIdOrCode !== '') {
            if (ctype_digit($rawPatientIdOrCode) && User::query()->whereKey((int) $rawPatientIdOrCode)->exists()) {
                $patientId = (int) $rawPatientIdOrCode;
            } else {
                $profile = PatientProfile::query()
                    ->where('patient_id', $rawPatientIdOrCode)
                    ->with('user')
                    ->first();

                if (! $profile || ! $profile->user) {
                    return response()->json([
                        'message' => 'Patient not found for provided patient id.',
                    ], 422);
                }

                $patientId = $profile->user->id;
            }
        }

        if (! empty($validated['doctor_id'])) {
            $conflict = Appointment::query()
                ->where('doctor_id', $validated['doctor_id'])
                ->whereDate('appointment_date', $validated['appointment_date'])
                ->where('appointment_time', $validated['appointment_time'])
                ->where('status', 'scheduled')
                ->exists();

            if ($conflict) {
                return response()->json([
                    'message' => 'Appointment conflict: doctor is already booked for this time slot.',
                ], 422);
            }

            $schedule = DoctorSchedule::query()
                ->where('doctor_id', $validated['doctor_id'])
                ->whereDate('schedule_date', $validated['appointment_date'])
                ->where('is_available', true)
                ->first();

            if ($schedule) {
                $time = $validated['appointment_time'];
                if (! ($time >= $schedule->start_time && $time <= $schedule->end_time)) {
                    return response()->json([
                        'message' => 'Selected time is outside doctor schedule.',
                    ], 422);
                }
            }
        }

        $isWalkIn = (bool) ($validated['is_walk_in'] ?? false);

        $appointment = Appointment::create([
            'patient_id' => $patientId,
            'doctor_id' => $validated['doctor_id'] ?? null,
            'clinic' => $validated['clinic'] ?? null,
            'appointment_date' => $validated['appointment_date'],
            'appointment_time' => $validated['appointment_time'],
            'type' => $validated['type'] ?? 'in_person',
            'status' => $validated['status'] ?? 'scheduled',
            'is_walk_in' => $isWalkIn,
            'confirmed_at' => $isWalkIn ? now() : null,
            'reason' => $validated['reason'] ?? null,
            'notes' => $validated['notes'] ?? null,
        ]);

        return response()->json($appointment->load(['patient', 'doctor']), 201);
    }

    public function show(int $id)
    {
        $appointment = Appointment::query()
            ->with([
                'patient:id,first_name,last_name,email,username,is_active',
                'doctor:id,first_name,last_name,email,username,is_active',
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
            'clinic' => ['nullable', 'string', 'max:100'],
            'appointment_date' => ['sometimes', 'date'],
            'appointment_time' => ['sometimes'],
            'type' => ['sometimes', Rule::in(['in_person', 'telemedicine'])],
            'status' => ['sometimes', Rule::in(['scheduled', 'completed', 'cancelled'])],
            'reason' => ['nullable', 'string', 'max:500'],
            'notes' => ['nullable', 'string'],
        ]);

        if (array_key_exists('patient_id', $validated)) {
            $patientId = null;
            $rawPatientIdOrCode = trim((string) ($validated['patient_id'] ?? ''));

            if ($rawPatientIdOrCode === '') {
                return response()->json([
                    'message' => 'Patient id is required.',
                ], 422);
            }

            if (ctype_digit($rawPatientIdOrCode) && User::query()->whereKey((int) $rawPatientIdOrCode)->exists()) {
                $patientId = (int) $rawPatientIdOrCode;
            } else {
                $profile = PatientProfile::query()
                    ->where('patient_id', $rawPatientIdOrCode)
                    ->with('user')
                    ->first();

                if (! $profile || ! $profile->user) {
                    return response()->json([
                        'message' => 'Patient not found for provided patient id.',
                    ], 422);
                }

                $patientId = $profile->user->id;
            }

            $validated['patient_id'] = $patientId;
        }

        $nextDoctorId = array_key_exists('doctor_id', $validated) ? $validated['doctor_id'] : $appointment->doctor_id;
        $nextDate = $validated['appointment_date'] ?? $appointment->appointment_date;
        $nextTime = $validated['appointment_time'] ?? $appointment->appointment_time;
        $nextStatus = $validated['status'] ?? $appointment->status;

        if (! empty($nextDoctorId) && $nextStatus === 'scheduled') {
            $conflict = Appointment::query()
                ->where('doctor_id', $nextDoctorId)
                ->whereDate('appointment_date', $nextDate)
                ->where('appointment_time', $nextTime)
                ->where('status', 'scheduled')
                ->where('id', '!=', $appointment->id)
                ->exists();

            if ($conflict) {
                return response()->json([
                    'message' => 'Appointment conflict: doctor is already booked for this time slot.',
                ], 422);
            }
        }

        $appointment->update($validated);

        return response()->json($appointment->fresh()->load(['patient', 'doctor']));
    }

    public function confirm(int $id)
    {
        $appointment = Appointment::findOrFail($id);

        if ($appointment->status !== 'scheduled') {
            return response()->json([
                'message' => 'Only scheduled appointments can be confirmed.',
            ], 422);
        }

        if ($appointment->confirmed_at !== null) {
            return response()->json($appointment->load(['patient', 'doctor']));
        }

        $appointment->confirmed_at = now();
        $appointment->save();

        return response()->json($appointment->fresh()->load(['patient', 'doctor']));
    }

    public function destroy(int $id)
    {
        $appointment = Appointment::findOrFail($id);
        $appointment->delete();

        return response()->json([
            'message' => 'Appointment deleted successfully',
        ]);
    }
}
