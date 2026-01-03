<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Teleconsultation;
use App\Models\Appointment;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class DoctorTeleconsultationController extends Controller
{
    public function start(Request $request)
    {
        $doctor = $request->user();

        $validated = $request->validate([
            'appointment_id' => ['required', 'integer', 'exists:appointments,id'],
        ]);

        $appointment = Appointment::findOrFail($validated['appointment_id']);

        // Verify appointment belongs to doctor
        if ($appointment->doctor_id !== $doctor->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Check if teleconsultation already exists
        $teleconsultation = Teleconsultation::where('appointment_id', $appointment->id)->first();

        if (!$teleconsultation) {
            // Generate meeting URL (placeholder - integrate with actual video service)
            $meetingUrl = 'https://meet.example.com/' . Str::random(16);

            $teleconsultation = Teleconsultation::create([
                'patient_id' => $appointment->patient_id,
                'doctor_id' => $doctor->id,
                'appointment_id' => $appointment->id,
                'scheduled_at' => now(),
                'status' => 'scheduled',
                'meeting_url' => $meetingUrl,
            ]);
        }

        return response()->json($teleconsultation->load(['patient', 'doctor']));
    }

    public function end(Request $request, int $id)
    {
        $doctor = $request->user();

        $teleconsultation = Teleconsultation::where('doctor_id', $doctor->id)->findOrFail($id);

        $validated = $request->validate([
            'notes' => ['nullable', 'string', 'max:2000'],
        ]);

        $teleconsultation->update([
            'status' => 'completed',
            'notes' => $validated['notes'] ?? $teleconsultation->notes,
        ]);

        // Mark appointment as completed
        if ($teleconsultation->appointment_id) {
            Appointment::where('id', $teleconsultation->appointment_id)
                ->update(['status' => 'completed']);
        }

        return response()->json($teleconsultation->load(['patient', 'doctor']));
    }
}

