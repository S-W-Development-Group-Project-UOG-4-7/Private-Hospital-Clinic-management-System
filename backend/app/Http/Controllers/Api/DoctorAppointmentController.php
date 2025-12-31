<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class DoctorAppointmentController extends Controller
{
    public function index(Request $request)
    {
        $doctor = $request->user();

        $query = Appointment::query()
            ->where('doctor_id', $doctor->id)
            ->with(['patient:id,first_name,last_name,email']);

        // Filter by date
        if ($request->has('date')) {
            $query->whereDate('appointment_date', $request->date);
        }

        // Filter by status
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        // Filter by patient name
        if ($request->has('patient_name')) {
            $query->whereHas('patient', function ($q) use ($request) {
                $q->whereRaw("CONCAT(first_name, ' ', last_name) LIKE ?", ['%' . $request->patient_name . '%']);
            });
        }

        $appointments = $query
            ->orderBy('appointment_date', 'asc')
            ->orderBy('appointment_time', 'asc')
            ->get();

        return response()->json([
            'data' => $appointments,
        ]);
    }

    public function show(Request $request, int $id)
    {
        $doctor = $request->user();

        $appointment = Appointment::query()
            ->where('doctor_id', $doctor->id)
            ->with(['patient:id,first_name,last_name,email'])
            ->findOrFail($id);

        return response()->json($appointment);
    }

    public function updateStatus(Request $request, int $id)
    {
        $doctor = $request->user();

        $appointment = Appointment::query()
            ->where('doctor_id', $doctor->id)
            ->findOrFail($id);

        $validated = $request->validate([
            'status' => ['required', Rule::in(['scheduled', 'completed', 'cancelled'])],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $appointment->update($validated);

        return response()->json($appointment->load('patient'));
    }
}

