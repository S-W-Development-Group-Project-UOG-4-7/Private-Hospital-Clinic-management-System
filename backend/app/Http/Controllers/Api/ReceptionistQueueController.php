<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\PatientProfile;
use App\Models\QueueEntry;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class ReceptionistQueueController extends Controller
{
    public function index(Request $request)
    {
        $date = $request->get('date') ?: now()->toDateString();
        $departmentId = $request->get('department_id');

        $startTime = $request->get('start_time');
        $endTime = $request->get('end_time');

        $query = QueueEntry::query()
            ->whereDate('queue_date', $date)
            ->where(function ($q) {
                $q->whereDoesntHave('appointment')
                  ->orWhereHas('appointment', function ($aq) {
                      $aq->where('visit_mode', Appointment::VISIT_MODE_PHYSICAL);
                  });
            })
            ->with([
                'patient:id,first_name,last_name,email,username,is_active',
                'doctor:id,first_name,last_name,email,username,is_active',
                'appointment.department',
            ])
            ->orderBy('queue_number');

        if (! empty($departmentId)) {
            $query->whereHas('appointment', function ($q) use ($departmentId) {
                $q->where('department_id', (int) $departmentId);
            });
        }

        if ($request->has('doctor_id')) {
            $doctorId = (int) $request->get('doctor_id');

            if ($doctorId === 0) {
                $query->whereNull('doctor_id');
            } else {
                $query->where('doctor_id', $doctorId);
            }
        }

        if ($request->has('status')) {
            $query->where('status', $request->get('status'));
        }

        if ($startTime && $endTime) {
            $query->whereHas('appointment', function ($q) use ($startTime, $endTime) {
                $q->whereBetween('appointment_time', [$startTime, $endTime]);
            });
        } elseif ($startTime) {
            $query->whereHas('appointment', function ($q) use ($startTime) {
                $q->where('appointment_time', '>=', $startTime);
            });
        } elseif ($endTime) {
            $query->whereHas('appointment', function ($q) use ($endTime) {
                $q->where('appointment_time', '<=', $endTime);
            });
        }

        $entries = $query->get();

        // Only return checked-in queue entries (hide scheduled appointments)
        return response()->json([
            'data' => $entries->values()->all(),
        ]);
    }

    public function checkIn(Request $request)
    {
        $validated = $request->validate([
            'patient_id' => ['nullable', 'max:50', 'required_without:patient_code'],
            'patient_code' => ['nullable', 'string', 'max:50', 'required_without:patient_id'],
            'doctor_id' => ['required', 'integer', 'exists:users,id'],
            'appointment_id' => ['nullable', 'integer', 'exists:appointments,id'],
            'department_id' => ['required', 'integer', 'exists:departments,id'],
            'queue_date' => ['nullable', 'date'],
        ]);

        $patientId = null;

        $patientCode = trim((string) ($validated['patient_code'] ?? ''));
        $rawPatientIdOrCode = trim((string) ($validated['patient_id'] ?? ''));

        if ($patientCode !== '') {
            $profile = PatientProfile::query()
                ->where('patient_id', $patientCode)
                ->with('user')
                ->first();

            if (! $profile || ! $profile->user) {
                return response()->json([
                    'message' => 'Patient not found for provided patient code.',
                ], 422);
            }

            $patientId = $profile->user->id;
        } elseif ($rawPatientIdOrCode !== '') {
            $profile = PatientProfile::query()
                ->where('patient_id', $rawPatientIdOrCode)
                ->with('user')
                ->first();

            if ($profile && $profile->user) {
                $patientId = $profile->user->id;
            } elseif (ctype_digit($rawPatientIdOrCode) && User::query()->whereKey((int) $rawPatientIdOrCode)->exists()) {
                $patientId = (int) $rawPatientIdOrCode;
            } else {
                return response()->json([
                    'message' => 'Patient not found for provided patient id.',
                ], 422);
            }
        }

        $queueDate = $validated['queue_date'] ?? now()->toDateString();
        $doctorId = (int) $validated['doctor_id'];
        $departmentId = (int) $validated['department_id'];

        return DB::transaction(function () use ($validated, $queueDate, $doctorId, $request, $patientId) {
            $departmentId = (int) $validated['department_id'];

            $doctor = User::query()->role('doctor')->whereKey($doctorId)->first();
            if (! $doctor || (int) $doctor->department_id !== $departmentId) {
                return response()->json([
                    'message' => 'Selected doctor does not belong to the chosen department.',
                ], 422);
            }

            $max = QueueEntry::query()
                ->whereDate('queue_date', $queueDate)
                ->where('doctor_id', $doctorId)
                ->lockForUpdate()
                ->max('queue_number');

            $nextNumber = ((int) $max) + 1;

            $appointmentId = $validated['appointment_id'] ?? null;

            if (! empty($appointmentId)) {
                $appointment = Appointment::findOrFail((int) $appointmentId);

                if ((int) $appointment->patient_id !== (int) $patientId) {
                    return response()->json([
                        'message' => 'Appointment does not belong to patient.',
                    ], 422);
                }

                if (! empty($appointment->department_id) && (int) $appointment->department_id !== $departmentId) {
                    return response()->json([
                        'message' => 'Appointment does not belong to the selected department.',
                    ], 422);
                }

                if ($appointment->visit_mode === Appointment::VISIT_MODE_ONLINE) {
                    return response()->json([
                        'message' => 'Online appointments cannot be checked into the physical queue.',
                    ], 422);
                }

                if ($appointment->confirmed_at === null && ! $appointment->is_walk_in) {
                    return response()->json([
                        'message' => 'Appointment must be confirmed before check-in.',
                    ], 422);
                }

                $alreadyCheckedIn = QueueEntry::query()
                    ->where('appointment_id', $appointment->id)
                    ->whereDate('queue_date', $queueDate)
                    ->whereIn('status', ['waiting', 'in_consultation', 'completed'])
                    ->exists();

                if ($alreadyCheckedIn) {
                    return response()->json([
                        'message' => 'Patient is already checked in for this appointment.',
                    ], 422);
                }

                $appointment->status = Appointment::STATUS_CHECKED_IN;
                $appointment->save();
            } else {
                $scheduledStart = now();
                $scheduledEnd = now()->addMinutes(30);

                if (Appointment::hasOverlap($doctorId, $scheduledStart, $scheduledEnd)) {
                    return response()->json([
                        'message' => 'Doctor is already booked for this time slot.',
                    ], 422);
                }

                $appointment = Appointment::create([
                    'patient_id' => $patientId,
                    'doctor_id' => $doctorId,
                    'department_id' => $departmentId,
                    'appointment_date' => $queueDate,
                    'appointment_time' => now()->format('H:i:s'),
                    'scheduled_start' => $scheduledStart,
                    'scheduled_end' => $scheduledEnd,
                    'type' => 'in_person',
                    'visit_mode' => Appointment::VISIT_MODE_PHYSICAL,
                    'booking_channel' => Appointment::BOOKING_CHANNEL_FRONTDESK,
                    'status' => Appointment::STATUS_CHECKED_IN,
                    'confirmed_at' => now(),
                    'is_walk_in' => true,
                ]);

                $appointmentId = $appointment->id;
            }

            $entry = QueueEntry::create([
                'appointment_id' => $appointmentId,
                'patient_id' => $patientId,
                'doctor_id' => $doctorId,
                'queue_date' => $queueDate,
                'queue_number' => $nextNumber,
                'status' => 'waiting',
                'checked_in_at' => now(),
                'created_by' => $request->user()?->id,
            ]);

            return response()->json($entry->load(['patient', 'doctor', 'appointment']), 201);
        });
    }

    public function updateStatus(Request $request, int $id)
    {
        $entry = QueueEntry::findOrFail($id);

        $validated = $request->validate([
            'status' => ['required', Rule::in(['waiting', 'in_consultation', 'completed', 'cancelled'])],
        ]);

        $entry->status = $validated['status'];

        if ($validated['status'] === 'completed') {
            $entry->checked_out_at = now();
            if ($entry->appointment) {
                $entry->appointment->status = Appointment::STATUS_COMPLETED;
                $entry->appointment->save();
            }
        }

        if ($validated['status'] === 'in_consultation' && $entry->appointment) {
            $entry->appointment->status = Appointment::STATUS_IN_PROGRESS;
            $entry->appointment->save();
        }

        $entry->save();

        return response()->json($entry->fresh()->load(['patient', 'doctor', 'appointment']));
    }

    public function clear(Request $request)
    {
        $validated = $request->validate([
            'date' => ['nullable', 'date'],
            'doctor_id' => ['nullable', 'integer', 'exists:users,id'],
            'department_id' => ['nullable', 'integer', 'exists:departments,id'],
        ]);

        $date = $validated['date'] ?? now()->toDateString();

        $query = QueueEntry::query()->whereDate('queue_date', $date);

        if (array_key_exists('doctor_id', $validated) && $validated['doctor_id'] !== null) {
            $query->where('doctor_id', $validated['doctor_id']);
        }
        if (array_key_exists('department_id', $validated) && $validated['department_id'] !== null) {
            $query->whereHas('appointment', function ($q) use ($validated) {
                $q->where('department_id', (int) $validated['department_id']);
            });
        }

        $count = $query->count();

        $query->delete();

        return response()->json(['deleted' => $count]);
    }
}
