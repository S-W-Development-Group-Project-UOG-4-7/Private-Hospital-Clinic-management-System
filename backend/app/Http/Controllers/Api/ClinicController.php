<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Clinic;
use App\Models\User;
use Illuminate\Http\Request;

class ClinicController extends Controller
{
    public function index()
    {
        $clinics = Clinic::query()->orderBy('name')->get();

        return response()->json(['data' => $clinics]);
    }

    public function doctors(Request $request, int $id)
    {
        $clinic = Clinic::findOrFail($id);

        // Return users in this clinic who have the doctor role
        $doctors = User::query()
            ->where('clinic_id', $clinic->id)
            ->whereHas('roles', function ($q) {
                $q->where('name', 'doctor');
            })
            ->select(['id', 'first_name', 'last_name', 'email'])
            ->get()
            ->map(function ($u) {
                return [
                    'id' => $u->id,
                    'name' => trim(($u->first_name ?? '') . ' ' . ($u->last_name ?? '')),
                    'email' => $u->email,
                ];
            });

        return response()->json(['data' => $doctors]);
    }

    /**
     * Return available time slots for a clinic on a given date.
     * Optional query param: doctor_id to get availability for a specific doctor (0 or 1 availability)
     */
    public function slots(Request $request, int $id)
    {
        $clinic = Clinic::findOrFail($id);

        $validated = $request->validate([
            'date' => ['required', 'date'],
            'doctor_id' => ['nullable', 'integer', 'exists:users,id'],
        ]);

        $date = $validated['date'];
        $doctorId = $validated['doctor_id'] ?? null;

        // Build a set of timeslots (30 minute increments between 08:00 and 17:00)
        $start = new \DateTimeImmutable("08:00");
        $end = new \DateTimeImmutable("17:00");
        $interval = new \DateInterval('PT30M');

        // Get list of doctors in this clinic
        $doctors = User::query()
            ->where('clinic_id', $clinic->id)
            ->whereHas('roles', function ($q) { $q->where('name', 'doctor'); })
            ->get();

        $totalDoctors = $doctors->count();

        $slots = [];
        $dt = $start;
        while ($dt < $end) {
            $time = $dt->format('H:i');

            if ($doctorId) {
                // Check whether the specified doctor has an appointment at this date/time
                $occupied = \App\Models\Appointment::query()
                    ->where('doctor_id', $doctorId)
                    ->whereDate('appointment_date', $date)
                    ->where('appointment_time', $time)
                    ->exists();

                $availableCount = $occupied ? 0 : 1;
            } else {
                // Count how many doctors already have appointments at this slot in this clinic
                $occupiedCount = \App\Models\Appointment::query()
                    ->where('clinic_id', $clinic->id)
                    ->whereDate('appointment_date', $date)
                    ->where('appointment_time', $time)
                    ->count();

                $availableCount = max(0, $totalDoctors - $occupiedCount);
            }

            $slots[] = [
                'time' => $time,
                'available_count' => $availableCount,
            ];

            $dt = $dt->add($interval);
        }

        // Return only slots with availability > 0 by default, but include all if query param include_all=true
        $includeAll = filter_var($request->query('include_all', 'false'), FILTER_VALIDATE_BOOLEAN);
        $filtered = $includeAll ? $slots : array_values(array_filter($slots, fn($s) => $s['available_count'] > 0));

        return response()->json(['date' => $date, 'clinic_id' => $clinic->id, 'slots' => $filtered]);
    }
}
