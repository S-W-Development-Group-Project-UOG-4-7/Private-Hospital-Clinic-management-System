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

        $startTime = $request->get('start_time');
        $endTime = $request->get('end_time');

        $query = QueueEntry::query()
            ->whereDate('queue_date', $date)
            ->with([
                'patient:id,first_name,last_name,email,username,is_active',
                'doctor:id,first_name,last_name,email,username,is_active',
                'appointment',
            ])
            ->orderBy('queue_number');

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

        $entries = $query->get();

        // Include scheduled appointments for the same date (even if not checked-in)
        $appointmentIdsInQueue = $entries->pluck('appointment_id')->filter()->unique()->toArray();

        $appointmentsQuery = Appointment::query()
            ->whereDate('appointment_date', $date)
            ->with([
                'patient:id,first_name,last_name,email,username,is_active',
                'doctor:id,first_name,last_name,email,username,is_active',
            ])
            ->orderBy('appointment_time');

        if ($request->has('doctor_id')) {
            $doctorId = (int) $request->get('doctor_id');
            if ($doctorId === 0) {
                $appointmentsQuery->whereNull('doctor_id');
            } else {
                $appointmentsQuery->where('doctor_id', $doctorId);
            }
        }

        if (! empty($appointmentIdsInQueue)) {
            $appointmentsQuery->whereNotIn('id', $appointmentIdsInQueue);
        }

        if ($startTime && $endTime) {
            $appointmentsQuery->whereBetween('appointment_time', [$startTime, $endTime]);
        } elseif ($startTime) {
            $appointmentsQuery->where('appointment_time', '>=', $startTime);
        } elseif ($endTime) {
            $appointmentsQuery->where('appointment_time', '<=', $endTime);
        }

        $appointments = $appointmentsQuery->get();

        // Transform appointments into queue-like items (not yet checked in)
        $appointmentItems = $appointments->map(function ($a) {
            return (object) [
                'id' => 'appt_' . $a->id,
                'queue_number' => null,
                'queue_date' => $a->appointment_date,
                'patient' => $a->patient ?? null,
                'doctor' => $a->doctor ?? null,
                'status' => $a->status ?? 'scheduled',
                'appointment' => $a,
            ];
        });

        // Merge checked-in entries first, then scheduled appointments
        $combined = $entries->map(function ($e) {
            return $e;
        })->merge($appointmentItems);

        return response()->json([
            'data' => $combined->values()->all(),
        ]);
    }

    public function checkIn(Request $request)
    {
        $validated = $request->validate([
            'patient_id' => ['nullable', 'max:50', 'required_without:patient_code'],
            'patient_code' => ['nullable', 'string', 'max:50', 'required_without:patient_id'],
            'doctor_id' => ['required', 'integer', 'exists:users,id'],
            'appointment_id' => ['nullable', 'integer', 'exists:appointments,id'],
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

        return DB::transaction(function () use ($validated, $queueDate, $doctorId, $request, $patientId) {
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
            } else {
                $appointment = Appointment::create([
                    'patient_id' => $patientId,
                    'doctor_id' => $doctorId,
                    'appointment_date' => $queueDate,
                    'appointment_time' => now()->format('H:i:s'),
                    'type' => 'in_person',
                    'status' => 'scheduled',
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
        }

        $entry->save();

        return response()->json($entry->fresh()->load(['patient', 'doctor', 'appointment']));
    }

    public function clear(Request $request)
    {
        $validated = $request->validate([
            'date' => ['nullable', 'date'],
            'doctor_id' => ['nullable', 'integer', 'exists:users,id'],
        ]);

        $date = $validated['date'] ?? now()->toDateString();

        $query = QueueEntry::query()->whereDate('queue_date', $date);

        if (array_key_exists('doctor_id', $validated) && $validated['doctor_id'] !== null) {
            $query->where('doctor_id', $validated['doctor_id']);
        }

        $count = $query->count();

        $query->delete();

        return response()->json(['deleted' => $count]);
    }
}
