<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\QueueEntry;
use App\Models\Appointment;
use Illuminate\Http\Request;

class PatientQueueController extends Controller
{
    /**
     * Queue status for a specific appointment (patient-only).
     */
    public function appointmentStatus(Request $request, int $appointmentId)
    {
        $user = $request->user();

        $appointment = Appointment::query()
            ->where('patient_id', $user->id)
            ->findOrFail($appointmentId);

        $today = now()->toDateString();
        $isToday = $appointment->appointment_date === $today;

        if (! $isToday) {
            return response()->json([
                'is_today' => false,
                'current_number' => null,
                'my_position' => null,
                'estimated_wait_minutes' => null,
            ]);
        }

        $queueEntry = QueueEntry::query()
            ->where('appointment_id', $appointment->id)
            ->whereDate('queue_date', $today)
            ->first();

        $currentNumber = QueueEntry::query()
            ->whereDate('queue_date', $today)
            ->whereIn('status', ['in_consultation', 'in_progress'])
            ->orderBy('queue_number')
            ->value('queue_number');

        $myPosition = null;
        $estimatedWait = null;

        if ($queueEntry && $queueEntry->queue_number) {
            $peopleAhead = QueueEntry::query()
                ->whereDate('queue_date', $today)
                ->whereIn('status', ['waiting', 'scheduled'])
                ->where('queue_number', '<', $queueEntry->queue_number)
                ->count();

            $avgMinutes = 15;
            $myPosition = $peopleAhead + 1;
            $estimatedWait = $peopleAhead * $avgMinutes;
        }

        return response()->json([
            'is_today' => true,
            'current_number' => $currentNumber,
            'my_position' => $myPosition,
            'estimated_wait_minutes' => $estimatedWait,
        ]);
    }
    /**
     * Get the patient's current queue position and queue information
     */
    public function status(Request $request)
    {
        $user = $request->user();
        $today = now()->toDateString();

        // Find patient's queue entry for today
        $myQueueEntry = QueueEntry::query()
            ->where('patient_id', $user->id)
            ->whereDate('created_at', $today)
            ->whereIn('status', ['waiting', 'scheduled', 'in_consultation', 'in_progress'])
            ->whereHas('appointment', function ($q) {
                $q->where('visit_mode', Appointment::VISIT_MODE_PHYSICAL);
            })
            ->with(['appointment:id,appointment_date,appointment_time,type,status,doctor_id', 'appointment.doctor:id,first_name,last_name'])
            ->first();

        // Get today's queue stats for the clinic
        $clinicId = $myQueueEntry?->appointment?->clinic_id ?? null;
        
        $queueStats = [
            'total_waiting' => 0,
            'my_position' => null,
            'estimated_wait_minutes' => null,
            'people_ahead' => 0,
        ];

        if ($myQueueEntry) {
            // Count how many people are waiting ahead of this patient
            $peopleAhead = QueueEntry::query()
                ->whereDate('created_at', $today)
                ->whereIn('status', ['waiting', 'scheduled'])
                ->where(function ($q) use ($myQueueEntry) {
                    $q->where('queue_number', '<', $myQueueEntry->queue_number ?? PHP_INT_MAX)
                      ->orWhere(function ($q2) use ($myQueueEntry) {
                          $q2->where('queue_number', $myQueueEntry->queue_number)
                             ->where('id', '<', $myQueueEntry->id);
                      });
                })
                ->count();

            $totalWaiting = QueueEntry::query()
                ->whereDate('created_at', $today)
                ->whereIn('status', ['waiting', 'scheduled'])
                ->count();

            // Estimate wait time (assuming ~15 minutes per patient)
            $avgConsultationMinutes = 15;
            $estimatedWait = $peopleAhead * $avgConsultationMinutes;

            $queueStats = [
                'total_waiting' => $totalWaiting,
                'my_position' => $peopleAhead + 1,
                'estimated_wait_minutes' => $estimatedWait,
                'people_ahead' => $peopleAhead,
            ];
        }

        // Get today's appointments for this patient
        $todaysAppointments = Appointment::query()
            ->where('patient_id', $user->id)
            ->whereDate('appointment_date', $today)
            ->with(['doctor:id,first_name,last_name', 'clinic:id,name'])
            ->get();

        return response()->json([
            'queue_entry' => $myQueueEntry ? [
                'id' => $myQueueEntry->id,
                'queue_number' => $myQueueEntry->queue_number,
                'status' => $myQueueEntry->status,
                'checked_in_at' => $myQueueEntry->checked_in_at,
                'appointment' => $myQueueEntry->appointment ? [
                    'id' => $myQueueEntry->appointment->id,
                    'time' => $myQueueEntry->appointment->appointment_time,
                    'type' => $myQueueEntry->appointment->type,
                    'doctor' => $myQueueEntry->appointment->doctor ? [
                        'name' => trim(($myQueueEntry->appointment->doctor->first_name ?? '') . ' ' . ($myQueueEntry->appointment->doctor->last_name ?? '')),
                    ] : null,
                ] : null,
            ] : null,
            'queue_stats' => $queueStats,
            'todays_appointments' => $todaysAppointments->map(fn($a) => [
                'id' => $a->id,
                'time' => $a->appointment_time,
                'type' => $a->type,
                'status' => $a->status,
                'doctor' => $a->doctor ? trim(($a->doctor->first_name ?? '') . ' ' . ($a->doctor->last_name ?? '')) : 'Any available doctor',
                'clinic' => $a->clinic?->name ?? 'OPD',
            ]),
        ]);
    }

    /**
     * Get general queue information for a clinic (public view)
     */
    public function clinicQueue(Request $request, int $clinicId)
    {
        $today = now()->toDateString();

        // Get queue entries for this clinic today
        $queueEntries = QueueEntry::query()
            ->whereHas('appointment', fn($q) => $q->where('clinic_id', $clinicId))
            ->whereDate('created_at', $today)
            ->whereIn('status', ['waiting', 'scheduled', 'in_consultation', 'in_progress'])
            ->orderBy('queue_number')
            ->get();

        $totalWaiting = $queueEntries->whereIn('status', ['waiting', 'scheduled'])->count();
        $inConsultation = $queueEntries->whereIn('status', ['in_consultation', 'in_progress'])->count();

        // Estimate wait time
        $avgConsultationMinutes = 15;
        $estimatedWaitForNew = $totalWaiting * $avgConsultationMinutes;

        return response()->json([
            'clinic_id' => $clinicId,
            'date' => $today,
            'total_waiting' => $totalWaiting,
            'in_consultation' => $inConsultation,
            'estimated_wait_minutes_for_new' => $estimatedWaitForNew,
            'current_queue_number' => $queueEntries->firstWhere('status', 'in_consultation')?->queue_number 
                ?? $queueEntries->firstWhere('status', 'in_progress')?->queue_number,
        ]);
    }
}
