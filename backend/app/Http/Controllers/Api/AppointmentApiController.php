<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\QueueEntry;
use Illuminate\Http\Request;

class AppointmentApiController extends Controller
{
    public function my(Request $request)
    {
        $user = $request->user();

        $appointments = Appointment::query()
            ->where('patient_id', $user->id)
            ->with(['doctor:id,first_name,last_name,email', 'department:id,name'])
            ->orderBy('appointment_date', 'desc')
            ->orderBy('appointment_time', 'desc')
            ->get();

        return response()->json([
            'data' => $appointments,
        ]);
    }

    public function cancel(Request $request, int $id)
    {
        $user = $request->user();

        $appointment = Appointment::query()->with('videoSession')->findOrFail($id);

        $isPatient = $user->hasRole('patient');
        $isReceptionist = $user->hasRole('receptionist');
        $isAdmin = $user->hasRole('admin');

        if ($isPatient && (int) $appointment->patient_id !== (int) $user->id) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        if (! $isPatient && ! $isReceptionist && ! $isAdmin) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $appointment->status = Appointment::STATUS_CANCELLED;
        $appointment->save();

        QueueEntry::query()->where('appointment_id', $appointment->id)->delete();

        if ($appointment->videoSession) {
            $appointment->videoSession->status = 'ENDED';
            $appointment->videoSession->save();
        }

        return response()->json($appointment->fresh());
    }
}
