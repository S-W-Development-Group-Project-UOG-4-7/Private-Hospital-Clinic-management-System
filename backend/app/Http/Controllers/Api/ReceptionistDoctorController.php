<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Http\Request;

class ReceptionistDoctorController extends Controller
{
    public function index(Request $request)
    {
        $departmentId = $request->get('department_id');
        $date = $request->get('date');
        $time = $request->get('time');
        $availableOnly = $request->boolean('available_only');

        $query = User::query()
            ->role('doctor')
            ->with('department:id,name')
            ->select(['id', 'first_name', 'last_name', 'email', 'phone', 'department_id', 'is_active']);

        if (! empty($departmentId)) {
            $query->where('department_id', (int) $departmentId);
        }

        if ($request->has('is_active')) {
            $query->where('is_active', (bool) $request->boolean('is_active'));
        }

        $doctors = $query
            ->orderBy('first_name')
            ->orderBy('last_name')
            ->get();

        $appointmentCounts = [];
        $conflictedDoctorIds = [];

        if (! empty($date)) {
            $appointmentCounts = Appointment::query()
                ->selectRaw('doctor_id, COUNT(*) as total')
                ->whereNotNull('doctor_id')
                ->whereDate('appointment_date', $date)
                ->whereIn('status', Appointment::blockingStatuses())
                ->groupBy('doctor_id')
                ->pluck('total', 'doctor_id')
                ->toArray();
        }

        if (! empty($date) && ! empty($time)) {
            $scheduledStart = CarbonImmutable::parse($date . ' ' . $time);
            $scheduledEnd = $scheduledStart->addMinutes(30);

            $conflictedDoctorIds = Appointment::query()
                ->whereNotNull('doctor_id')
                ->whereIn('status', Appointment::blockingStatuses())
                ->whereNotNull('scheduled_start')
                ->whereNotNull('scheduled_end')
                ->where('scheduled_start', '<', $scheduledEnd)
                ->where('scheduled_end', '>', $scheduledStart)
                ->pluck('doctor_id')
                ->unique()
                ->values()
                ->toArray();
        }

        $doctorData = $doctors->map(function ($doctor) use ($appointmentCounts, $conflictedDoctorIds) {
            $doctorId = $doctor->id;
            $appointmentCount = (int) ($appointmentCounts[$doctorId] ?? 0);
            $isAvailable = ! in_array($doctorId, $conflictedDoctorIds, true);

            return [
                'id' => $doctorId,
                'first_name' => $doctor->first_name,
                'last_name' => $doctor->last_name,
                'email' => $doctor->email,
                'phone' => $doctor->phone,
                'department_id' => $doctor->department_id,
                'department' => $doctor->department ? [
                    'id' => $doctor->department->id,
                    'name' => $doctor->department->name,
                ] : null,
                'is_active' => (bool) $doctor->is_active,
                'appointment_count' => $appointmentCount,
                'is_available' => $isAvailable,
            ];
        });

        if ($availableOnly) {
            $doctorData = $doctorData->filter(fn ($doctor) => $doctor['is_available'])->values();
        }

        return response()->json([
            'data' => $doctorData,
        ]);
    }
}
