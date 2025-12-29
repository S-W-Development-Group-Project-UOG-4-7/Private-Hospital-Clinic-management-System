<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use Illuminate\Http\Request;
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
            'doctor_id' => ['nullable', 'integer', 'exists:users,id'],
            'appointment_date' => ['required', 'date'],
            'appointment_time' => ['required'],
            'type' => ['nullable', Rule::in(['in_person', 'telemedicine'])],
            'reason' => ['nullable', 'string', 'max:500'],
        ]);

        $appointment = Appointment::create([
            'patient_id' => $user->id,
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
            'doctor_id' => ['nullable', 'integer', 'exists:users,id'],
            'appointment_date' => ['sometimes', 'date'],
            'appointment_time' => ['sometimes'],
            'type' => ['sometimes', Rule::in(['in_person', 'telemedicine'])],
            'status' => ['sometimes', Rule::in(['scheduled', 'cancelled'])],
            'reason' => ['nullable', 'string', 'max:500'],
        ]);

        $appointment->update($validated);

        return response()->json($appointment->load('doctor'));
    }

    public function destroy(Request $request, int $id)
    {
        $user = $request->user();

        $appointment = Appointment::query()
            ->where('patient_id', $user->id)
            ->findOrFail($id);

        $appointment->delete();

        return response()->json([
            'message' => 'Appointment deleted successfully',
        ]);
    }
}
