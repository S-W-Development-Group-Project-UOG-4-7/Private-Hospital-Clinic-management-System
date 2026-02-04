<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Services\TelemedSessionService;
use Illuminate\Http\Request;

class TelemedSessionController extends Controller
{
    public function show(Request $request, int $appointmentId)
    {
        $user = $request->user();

        $appointment = Appointment::query()
            ->with('videoSession')
            ->findOrFail($appointmentId);

        if ($appointment->visit_mode !== Appointment::VISIT_MODE_ONLINE) {
            return response()->json(['message' => 'Video session is only available for online appointments.'], 422);
        }

        $session = $appointment->videoSession;
        if (! $session) {
            return response()->json(['message' => 'Video session not found.'], 404);
        }

        $isDoctor = $user->hasRole('doctor');
        $isPatient = $user->hasRole('patient');

        if ($isDoctor && (int) $appointment->doctor_id !== (int) $user->id) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        if ($isPatient && (int) $appointment->patient_id !== (int) $user->id) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        if (! $isDoctor && ! $isPatient) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $joinUrl = null;
        if ($isDoctor) {
            $joinUrl = $session->join_url_doctor;
        } elseif ($session->status === 'LIVE') {
            $joinUrl = $session->join_url_patient;
        }

        return response()->json([
            'appointment_id' => $appointment->id,
            'status' => $session->status,
            'provider' => $session->provider,
            'join_url' => $joinUrl,
        ]);
    }

    public function start(Request $request, int $appointmentId)
    {
        $user = $request->user();

        if (! $user->hasRole('doctor')) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $appointment = Appointment::query()->findOrFail($appointmentId);

        if ((int) $appointment->doctor_id !== (int) $user->id) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        if ($appointment->visit_mode !== Appointment::VISIT_MODE_ONLINE) {
            return response()->json(['message' => 'Video session is only available for online appointments.'], 422);
        }

        $session = $appointment->videoSession;
        if (! $session) {
            $session = (new TelemedSessionService())->createForAppointment($appointment);
        }

        $session->status = 'LIVE';
        $session->save();

        $appointment->status = Appointment::STATUS_IN_PROGRESS;
        $appointment->save();

        return response()->json($session);
    }

    public function end(Request $request, int $appointmentId)
    {
        $user = $request->user();

        if (! $user->hasRole('doctor')) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $appointment = Appointment::query()->findOrFail($appointmentId);

        if ((int) $appointment->doctor_id !== (int) $user->id) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        if ($appointment->visit_mode !== Appointment::VISIT_MODE_ONLINE) {
            return response()->json(['message' => 'Video session is only available for online appointments.'], 422);
        }

        $session = $appointment->videoSession;
        if (! $session) {
            return response()->json(['message' => 'Video session not found.'], 404);
        }

        $session->status = 'ENDED';
        $session->save();

        $appointment->status = Appointment::STATUS_COMPLETED;
        $appointment->save();

        return response()->json($session);
    }
}
