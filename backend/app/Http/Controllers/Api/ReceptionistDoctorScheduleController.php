<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DoctorSchedule;
use Illuminate\Http\Request;

class ReceptionistDoctorScheduleController extends Controller
{
    public function index(Request $request)
    {
        $query = DoctorSchedule::query()->with(['doctor:id,first_name,last_name,email,username,is_active']);

        if ($request->has('doctor_id')) {
            $query->where('doctor_id', (int) $request->get('doctor_id'));
        }

        if ($request->has('date')) {
            $query->whereDate('schedule_date', $request->get('date'));
        }

        $schedules = $query
            ->orderBy('schedule_date', 'desc')
            ->orderBy('start_time')
            ->paginate((int) ($request->get('per_page') ?: 20));

        return response()->json($schedules);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'doctor_id' => ['required', 'integer', 'exists:users,id'],
            'schedule_date' => ['required', 'date'],
            'start_time' => ['required'],
            'end_time' => ['required'],
            'is_available' => ['sometimes', 'boolean'],
            'notes' => ['nullable', 'string'],
        ]);

        $schedule = DoctorSchedule::create([
            'doctor_id' => $validated['doctor_id'],
            'schedule_date' => $validated['schedule_date'],
            'start_time' => $validated['start_time'],
            'end_time' => $validated['end_time'],
            'is_available' => $validated['is_available'] ?? true,
            'notes' => $validated['notes'] ?? null,
        ]);

        return response()->json($schedule->load('doctor'), 201);
    }

    public function update(Request $request, int $id)
    {
        $schedule = DoctorSchedule::findOrFail($id);

        $validated = $request->validate([
            'doctor_id' => ['sometimes', 'integer', 'exists:users,id'],
            'schedule_date' => ['sometimes', 'date'],
            'start_time' => ['sometimes'],
            'end_time' => ['sometimes'],
            'is_available' => ['sometimes', 'boolean'],
            'notes' => ['nullable', 'string'],
        ]);

        $schedule->update($validated);

        return response()->json($schedule->fresh()->load('doctor'));
    }

    public function destroy(int $id)
    {
        $schedule = DoctorSchedule::findOrFail($id);
        $schedule->delete();

        return response()->json([
            'message' => 'Schedule deleted successfully',
        ]);
    }
}
