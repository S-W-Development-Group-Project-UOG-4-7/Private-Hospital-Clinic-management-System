<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\ConsultationNote;
use App\Models\QueueEntry;
use Illuminate\Http\Request;

class DoctorConsultationController extends Controller
{
    public function show(Request $request, int $appointmentId)
    {
        $doctor = $request->user();

        $appointment = Appointment::query()
            ->where('doctor_id', $doctor->id)
            ->findOrFail($appointmentId);

        $note = ConsultationNote::query()
            ->where('appointment_id', $appointment->id)
            ->first();

        return response()->json([
            'appointment_id' => $appointment->id,
            'note' => $note,
        ]);
    }

    public function upsert(Request $request, int $appointmentId)
    {
        $doctor = $request->user();

        $appointment = Appointment::query()
            ->where('doctor_id', $doctor->id)
            ->findOrFail($appointmentId);

        $validated = $request->validate([
            'subjective' => ['nullable', 'string'],
            'objective' => ['nullable', 'string'],
            'assessment' => ['nullable', 'string'],
            'plan' => ['nullable', 'string'],
            'diagnosis_text' => ['nullable', 'string'],
            'vitals_json' => ['nullable', 'array'],
            'attachments' => ['nullable', 'array'],
        ]);

        $note = ConsultationNote::updateOrCreate(
            ['appointment_id' => $appointment->id],
            array_merge($validated, [
                'patient_id' => $appointment->patient_id,
                'doctor_id' => $appointment->doctor_id,
            ])
        );

        return response()->json($note);
    }

    public function start(Request $request, int $appointmentId)
    {
        $doctor = $request->user();

        $appointment = Appointment::query()
            ->where('doctor_id', $doctor->id)
            ->findOrFail($appointmentId);

        $appointment->status = Appointment::STATUS_IN_PROGRESS;
        $appointment->save();

        QueueEntry::query()
            ->where('appointment_id', $appointment->id)
            ->whereIn('status', ['waiting', 'in_consultation', 'in_progress'])
            ->update([
                'status' => 'in_consultation',
                'consultation_started_at' => now(),
                'called_at' => now(),
            ]);

        return response()->json($appointment->fresh()->load('patient'));
    }

    public function complete(Request $request, int $appointmentId)
    {
        $doctor = $request->user();

        $appointment = Appointment::query()
            ->where('doctor_id', $doctor->id)
            ->findOrFail($appointmentId);

        $appointment->status = Appointment::STATUS_COMPLETED;
        $appointment->save();

        QueueEntry::query()
            ->where('appointment_id', $appointment->id)
            ->whereIn('status', ['waiting', 'in_consultation', 'in_progress'])
            ->update([
                'status' => 'completed',
                'checked_out_at' => now(),
                'completed_at' => now(),
            ]);

        return response()->json($appointment->fresh()->load('patient'));
    }
}
