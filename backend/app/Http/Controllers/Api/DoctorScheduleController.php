<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use Illuminate\Http\Request;

class DoctorScheduleController extends Controller
{
    public function index(Request $request)
    {
        $doctor = $request->user();

        $query = Appointment::query()
            ->where('doctor_id', $doctor->id)
            ->whereIn('status', Appointment::activeScheduleStatuses())
            ->with(['patient:id,first_name,last_name,email', 'department:id,name']);

        if ($request->has('date')) {
            $query->whereDate('appointment_date', $request->get('date'));
        }

        $appointments = $query
            ->orderBy('scheduled_start')
            ->orderBy('appointment_time')
            ->get();

        return response()->json([
            'physical' => $appointments->where('visit_mode', Appointment::VISIT_MODE_PHYSICAL)->values(),
            'online' => $appointments->where('visit_mode', Appointment::VISIT_MODE_ONLINE)->values(),
        ]);
    }
}
