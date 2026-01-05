<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\QueueEntry;
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
            'doctor_id' => ['nullable', 'integer', 'exists:users,id'],
            'appointment_date' => ['required', 'date'],
            'appointment_time' => ['required'],
            'type' => ['nullable', Rule::in(['in_person', 'telemedicine'])],
            'reason' => ['nullable', 'string', 'max:500'],
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

        if (! empty($clinicId) && ! empty($validated['doctor_id'])) {
            $doctor = \App\Models\User::find($validated['doctor_id']);
            if (! $doctor || (int) $doctor->clinic_id !== (int) $clinicId) {
                return response()->json(['message' => 'Selected doctor does not belong to the chosen clinic.'], 422);
            }
        }

        if (! empty($clinicId) && ! empty($validated['appointment_date']) && ! empty($validated['appointment_time'])) {
            $clinic = \App\Models\Clinic::find($clinicId);
            if (! $clinic) {
                return response()->json(['message' => 'Clinic not found'], 404);
            }

            if (! empty($validated['doctor_id'])) {
                $exists = \App\Models\Appointment::query()
                    ->where('doctor_id', $validated['doctor_id'])
                    ->whereDate('appointment_date', $validated['appointment_date'])
                    ->where('appointment_time', $validated['appointment_time'])
                    ->exists();

                if ($exists) {
                    return response()->json(['message' => 'Selected doctor is not available at the chosen time.'], 422);
                }
            } else {
                $totalDoctors = \App\Models\User::query()
                    ->where('clinic_id', $clinicId)
                    ->whereHas('roles', fn($q) => $q->where('name', 'doctor'))
                    ->count();

                $occupiedCount = \App\Models\Appointment::query()
                    ->where('clinic_id', $clinicId)
                    ->whereDate('appointment_date', $validated['appointment_date'])
                    ->where('appointment_time', $validated['appointment_time'])
                    ->count();

                if ($occupiedCount >= $totalDoctors) {
                    return response()->json(['message' => 'No doctors available in this clinic at the chosen time.'], 422);
                }
            }
        }

        $appointment = Appointment::create([
            'patient_id' => $user->id,
            'clinic_id' => $clinicId ?? null,
            'doctor_id' => $validated['doctor_id'] ?? null,
            'appointment_date' => $validated['appointment_date'],
            'appointment_time' => $validated['appointment_time'],
            'type' => $validated['type'] ?? 'in_person',
            'status' => 'scheduled',
            'reason' => $validated['reason'] ?? null,
        ]);

        return response()->json($appointment->load('doctor'), 201);
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
            'type' => ['sometimes', Rule::in(['in_person', 'telemedicine'])],
            'status' => ['sometimes', Rule::in(['scheduled', 'cancelled'])],
            'reason' => ['nullable', 'string', 'max:500'],
        ]);

        if (! empty($validated['clinic_id']) && ! empty($validated['doctor_id'])) {
            $doctor = \App\Models\User::find($validated['doctor_id']);
            if (! $doctor || (int) $doctor->clinic_id !== (int) $validated['clinic_id']) {
                return response()->json(['message' => 'Selected doctor does not belong to the chosen clinic.'], 422);
            }
        }

        $appointment->update($validated);

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
}
