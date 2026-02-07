<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Clinic;
use App\Models\User;
use Carbon\CarbonImmutable;
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
            ->with('department:id,name')
            ->select(['id', 'first_name', 'last_name', 'email', 'phone', 'department_id'])
            ->get()
            ->map(function ($u) {
                return [
                    'id' => $u->id,
                    'name' => trim(($u->first_name ?? '') . ' ' . ($u->last_name ?? '')),
                    'email' => $u->email,
                    'phone' => $u->phone,
                    'department' => $u->department ? [
                        'id' => $u->department->id,
                        'name' => $u->department->name,
                    ] : null,
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
            'department_id' => ['nullable', 'integer', 'exists:departments,id'],
        ]);

        $date = $validated['date'];
        $doctorId = $validated['doctor_id'] ?? null;
        $departmentId = $validated['department_id'] ?? null;

        // Build a set of timeslots (30 minute increments between 08:00 and 22:00)
        $start = new \DateTimeImmutable("08:00");
        $end = new \DateTimeImmutable("22:00");
        $interval = new \DateInterval('PT30M');

        // Get list of doctors in this clinic
        $includeUnassigned = filter_var($request->query('include_unassigned', 'false'), FILTER_VALIDATE_BOOLEAN);
        $shouldIncludeUnassigned = $includeUnassigned;

        $doctorsQuery = User::query()
            ->whereHas('roles', function ($q) { $q->where('name', 'doctor'); });

        if ($shouldIncludeUnassigned) {
            $doctorsQuery->where(function ($q) use ($clinic) {
                $q->where('clinic_id', $clinic->id)->orWhereNull('clinic_id');
            });
        } else {
            $doctorsQuery->where('clinic_id', $clinic->id);
        }

        if ($departmentId) {
            $doctorsQuery->where('department_id', (int) $departmentId);
        }

        if ($doctorId) {
            $doctorsQuery->where('id', (int) $doctorId);
        }

        $doctors = $doctorsQuery->get();

        if ($doctors->isEmpty() && $shouldIncludeUnassigned) {
            $fallbackQuery = User::query()
                ->whereHas('roles', function ($q) { $q->where('name', 'doctor'); })
                ->whereNull('clinic_id');

            if ($departmentId) {
                $fallbackQuery->where('department_id', (int) $departmentId);
            }

            $doctors = $fallbackQuery->get();
        }
        $doctorIds = $doctors->pluck('id')->toArray();

        $totalDoctors = $doctors->count();

        $slots = [];
        $dt = $start;
        while ($dt < $end) {
            $time = $dt->format('H:i');

            if (CarbonImmutable::parse($date)->isSameDay(now())) {
                $slotStart = CarbonImmutable::parse($date . ' ' . $time);
                if ($slotStart->isPast()) {
                    $dt = $dt->add($interval);
                    continue;
                }
            }

            if ($totalDoctors === 0) {
                $availableCount = 0;
            } else {
                $scheduledStart = CarbonImmutable::parse($date . ' ' . $time);
                $scheduledEnd = $scheduledStart->addMinutes(30);

                $bookingQuery = \App\Models\Appointment::query()
                    ->whereIn('status', \App\Models\Appointment::blockingStatuses())
                    ->whereDate('appointment_date', $date)
                    ->where('appointment_time', $time)
                    ->where(function ($q) use ($clinic) {
                        $q->where('clinic_id', $clinic->id);
                        if (! empty($clinic->name)) {
                            $q->orWhere(function ($sub) use ($clinic) {
                                $sub->whereNull('clinic_id')
                                    ->whereRaw('LOWER(clinic) = ?', [strtolower((string) $clinic->name)]);
                            });
                        }
                    });

                $isBooked = $bookingQuery->exists();
                if ($isBooked) {
                    $availableCount = 0;
                } else {
                    $hasAvailableDoctor = false;
                    foreach ($doctorIds as $id) {
                        if (! \App\Models\Appointment::hasOverlap((int) $id, $scheduledStart, $scheduledEnd)) {
                            $hasAvailableDoctor = true;
                            break;
                        }
                    }
                    $availableCount = $hasAvailableDoctor ? 1 : 0;
                }
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
