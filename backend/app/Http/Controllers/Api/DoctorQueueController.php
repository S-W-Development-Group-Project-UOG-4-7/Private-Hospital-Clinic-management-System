<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\QueueEntry;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class DoctorQueueController extends Controller
{
    /**
     * Get queue entries for the authenticated doctor.
     */
    public function index(Request $request)
    {
        $doctor = $request->user();
        $date = $request->get('date') ?: now()->toDateString();

        // Get queue entries assigned to this doctor OR unassigned (general queue)
        $query = QueueEntry::query()
            ->where(function ($q) use ($doctor) {
                // Entries directly assigned to this doctor
                $q->where('doctor_id', $doctor->id)
                  // OR entries where the appointment is assigned to this doctor
                  ->orWhereHas('appointment', function ($aq) use ($doctor) {
                      $aq->where('doctor_id', $doctor->id);
                  })
                  // OR unassigned entries (general queue) - both queue and appointment have no doctor
                  ->orWhere(function ($uq) {
                      $uq->whereNull('doctor_id')
                         ->where(function ($apq) {
                             $apq->whereDoesntHave('appointment')
                                 ->orWhereHas('appointment', function ($aq) {
                                     $aq->whereNull('doctor_id');
                                 });
                         });
                  });
            })
            ->where(function ($q) {
                $q->whereDoesntHave('appointment')
                  ->orWhereHas('appointment', function ($aq) {
                      $aq->where('visit_mode', Appointment::VISIT_MODE_PHYSICAL);
                  });
            })
            ->whereDate('queue_date', $date)
            ->with([
                'patient:id,first_name,last_name,email,username,is_active',
                'patient.patientProfile',
                'appointment',
            ])
            ->orderBy('queue_number');

        if ($request->has('status')) {
            $query->where('status', $request->get('status'));
        }

        $entries = $query->get();

        // Also get scheduled appointments not yet checked-in (assigned to this doctor or unassigned)
        $appointmentIdsInQueue = $entries->pluck('appointment_id')->filter()->unique()->toArray();

        $appointmentsQuery = Appointment::query()
            ->where(function ($q) use ($doctor) {
                $q->where('doctor_id', $doctor->id)
                  ->orWhereNull('doctor_id');
            })
            ->where('visit_mode', Appointment::VISIT_MODE_PHYSICAL)
            ->whereIn('status', Appointment::activeScheduleStatuses())
            ->whereDate('appointment_date', $date)
            ->with([
                'patient:id,first_name,last_name,email,username,is_active',
                'patient.patientProfile',
            ])
            ->orderBy('appointment_time');

        if (!empty($appointmentIdsInQueue)) {
            $appointmentsQuery->whereNotIn('id', $appointmentIdsInQueue);
        }

        $appointments = $appointmentsQuery->get();

        // Transform appointments into queue-like items (not yet checked in)
        $appointmentItems = $appointments->map(function ($a) {
            return [
                'id' => 'appt_' . $a->id,
                'appointment_id' => $a->id,
                'patient_id' => $a->patient_id,
                'doctor_id' => $a->doctor_id,
                'queue_number' => null,
                'queue_date' => $a->appointment_date,
                'patient' => $a->patient ?? null,
                'doctor' => null,
                'status' => $a->status ?? Appointment::STATUS_CONFIRMED,
                'appointment' => $a,
                'checked_in' => false,
            ];
        });

        // Transform queue entries to arrays for consistent merging
        $queueItems = $entries->map(function ($e) {
            return [
                'id' => $e->id,
                'appointment_id' => $e->appointment_id,
                'patient_id' => $e->patient_id,
                'doctor_id' => $e->doctor_id,
                'queue_number' => $e->queue_number,
                'queue_date' => $e->queue_date,
                'patient' => $e->patient ?? null,
                'doctor' => $e->doctor ?? null,
                'status' => $e->status,
                'appointment' => $e->appointment,
                'checked_in' => true,
                'checked_in_at' => $e->checked_in_at ?? null,
                'called_at' => $e->called_at ?? null,
            ];
        });

        // Merge checked-in entries first, then scheduled appointments
        $combined = $queueItems->concat($appointmentItems);

        return response()->json([
            'data' => $combined->values()->all(),
        ]);
    }

    /**
     * Update the status of a queue entry (e.g., start consultation, complete).
     */
    public function updateStatus(Request $request, int $id)
    {
        $doctor = $request->user();

        // Allow updating entries assigned to this doctor OR unassigned entries
        $entry = QueueEntry::query()
            ->where(function ($q) use ($doctor) {
                $q->where('doctor_id', $doctor->id)
                  ->orWhereHas('appointment', function ($aq) use ($doctor) {
                      $aq->where('doctor_id', $doctor->id);
                  })
                  ->orWhere(function ($uq) {
                      $uq->whereNull('doctor_id')
                         ->where(function ($apq) {
                             $apq->whereDoesntHave('appointment')
                                 ->orWhereHas('appointment', function ($aq) {
                                     $aq->whereNull('doctor_id');
                                 });
                         });
                  });
            })
            ->findOrFail($id);

        $validated = $request->validate([
            'status' => ['required', Rule::in(['waiting', 'in_progress', 'in_consultation', 'completed', 'cancelled', 'no_show'])],
        ]);

        $entry->status = $validated['status'];

        // When starting consultation, assign this doctor to the entry
        if (in_array($validated['status'], ['in_consultation', 'in_progress'])) {
            // If this entry was unassigned (no doctor), we need to assign it to this doctor
            // and potentially update the queue_number to avoid unique constraint violation
            if ($entry->doctor_id === null || $entry->doctor_id !== $doctor->id) {
                $entry->doctor_id = $doctor->id;
                
                // Get the next available queue number for this doctor on this date
                $maxQueueNumber = QueueEntry::where('doctor_id', $doctor->id)
                    ->whereDate('queue_date', $entry->queue_date)
                    ->max('queue_number') ?? 0;
                
                $entry->queue_number = $maxQueueNumber + 1;
            }
            
            $entry->consultation_started_at = now();
            $entry->called_at = now();
            
            // Also update the appointment's doctor if not set
            if ($entry->appointment && !$entry->appointment->doctor_id) {
                $entry->appointment->doctor_id = $doctor->id;
                $entry->appointment->save();
            }

            if ($entry->appointment) {
                $entry->appointment->status = Appointment::STATUS_IN_PROGRESS;
                $entry->appointment->save();
            }
        }

        if ($validated['status'] === 'completed') {
            $entry->checked_out_at = now();
            $entry->completed_at = now();
            
            // Update appointment status as well
            if ($entry->appointment) {
                $entry->appointment->status = Appointment::STATUS_COMPLETED;
                $entry->appointment->save();
            }
        }

        $entry->save();

        return response()->json($entry->fresh()->load(['patient', 'appointment']));
    }

    /**
     * Get the next patient in queue for this doctor.
     */
    public function next(Request $request)
    {
        $doctor = $request->user();
        $date = $request->get('date') ?: now()->toDateString();

        $entry = QueueEntry::query()
            ->where(function ($q) use ($doctor) {
                $q->where('doctor_id', $doctor->id)
                  ->orWhereHas('appointment', function ($aq) use ($doctor) {
                      $aq->where('doctor_id', $doctor->id);
                  })
                  ->orWhere(function ($uq) {
                      $uq->whereNull('doctor_id')
                         ->where(function ($apq) {
                             $apq->whereDoesntHave('appointment')
                                 ->orWhereHas('appointment', function ($aq) {
                                     $aq->whereNull('doctor_id');
                                 });
                         });
                  });
            })
            ->whereDate('queue_date', $date)
            ->where('status', 'waiting')
            ->orderBy('queue_number')
            ->with(['patient', 'patient.patientProfile', 'appointment'])
            ->first();

        if (!$entry) {
            return response()->json(['message' => 'No patients waiting in queue.'], 404);
        }

        return response()->json($entry);
    }

    /**
     * Call the next patient (set status to in_consultation).
     */
    public function callNext(Request $request)
    {
        $doctor = $request->user();
        $date = $request->get('date') ?: now()->toDateString();

        $entry = QueueEntry::query()
            ->where(function ($q) use ($doctor) {
                $q->where('doctor_id', $doctor->id)
                  ->orWhereHas('appointment', function ($aq) use ($doctor) {
                      $aq->where('doctor_id', $doctor->id);
                  })
                  ->orWhere(function ($uq) {
                      $uq->whereNull('doctor_id')
                         ->where(function ($apq) {
                             $apq->whereDoesntHave('appointment')
                                 ->orWhereHas('appointment', function ($aq) {
                                     $aq->whereNull('doctor_id');
                                 });
                         });
                  });
            })
            ->whereDate('queue_date', $date)
            ->where('status', 'waiting')
            ->orderBy('queue_number')
            ->first();

        if (!$entry) {
            return response()->json(['message' => 'No patients waiting in queue.'], 404);
        }

        // Assign this doctor to the entry
        $entry->doctor_id = $doctor->id;
        $entry->status = 'in_consultation';
        $entry->consultation_started_at = now();
        $entry->called_at = now();
        $entry->save();
        
        // Also update the appointment's doctor if not set
        if ($entry->appointment && !$entry->appointment->doctor_id) {
            $entry->appointment->doctor_id = $doctor->id;
            $entry->appointment->save();
        }

        if ($entry->appointment) {
            $entry->appointment->status = Appointment::STATUS_IN_PROGRESS;
            $entry->appointment->save();
        }

        return response()->json($entry->fresh()->load(['patient', 'patient.patientProfile', 'appointment']));
    }
}
