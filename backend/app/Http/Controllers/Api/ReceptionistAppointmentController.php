<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\PatientProfile;
use App\Models\QueueEntry;
use App\Models\User;
use App\Models\Department; // <--- ADDED IMPORT
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class ReceptionistAppointmentController extends Controller
{
    public function index(Request $request)
    {
        $query = Appointment::query()
            ->with([
                'patient:id,first_name,last_name,email,username,is_active',
                'doctor:id,first_name,last_name,email,username,is_active',
                'department' // <--- ADDED: Include department details
            ]);

        if ($request->has('date')) {
            $query->whereDate('appointment_date', $request->get('date'));
        }

        if ($request->has('status')) {
            $query->where('status', $request->get('status'));
        }

        if ($request->has('patient_id')) {
            $query->where('patient_id', (int) $request->get('patient_id'));
        }

        if ($request->has('doctor_id')) {
            $query->where('doctor_id', (int) $request->get('doctor_id'));
        }

        // <--- ADDED: Filter by Department if needed
        if ($request->has('department_id')) {
            $query->where('department_id', (int) $request->get('department_id'));
        }

        $appointments = $query
            ->orderBy('appointment_date', 'desc')
            ->orderBy('appointment_time', 'desc')
            ->paginate((int) ($request->get('per_page') ?: 20));

        return response()->json($appointments);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'patient_id' => ['nullable', 'max:50', 'required_without:patient_code'],
            'patient_code' => ['nullable', 'string', 'max:50', 'required_without:patient_id'],
            'doctor_id' => ['nullable', 'integer', 'exists:users,id'],
            'department_id' => ['nullable', 'integer', 'exists:departments,id'], // <--- ADDED VALIDATION
            'appointment_date' => ['required', 'date'],
            'appointment_time' => ['required'],
            'type' => ['nullable', Rule::in(['in_person', 'telemedicine'])],
            'status' => ['nullable', Rule::in(['scheduled', 'completed', 'cancelled'])],
            'is_walk_in' => ['nullable', 'boolean'],
            'reason' => ['nullable', 'string'], // Added reason
            'notes' => ['nullable', 'string'],   // Added notes
        ]);

        $patientId = null;
        $patientCode = trim((string) ($validated['patient_code'] ?? ''));
        $rawPatientIdOrCode = trim((string) ($validated['patient_id'] ?? ''));

        // --- PATIENT LOOKUP LOGIC (Kept exactly as you had it) ---
        if ($patientCode !== '') {
            $profile = PatientProfile::query()
                ->where('patient_id', $patientCode)
                ->with('user')
                ->first();

            if (! $profile || ! $profile->user) {
                return response()->json(['message' => 'Patient not found for provided patient code.'], 422);
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
                return response()->json(['message' => 'Patient not found for provided patient id.'], 422);
            }
        }

        if (empty($patientId)) {
            return response()->json(['message' => 'Patient not found for provided patient id.'], 422);
        }

        $isWalkIn = (bool) ($validated['is_walk_in'] ?? false);

        return DB::transaction(function () use ($validated, $patientId, $isWalkIn, $request) {
            $appointmentDate = $validated['appointment_date'];

            // --- APPOINTMENT NUMBER LOCKING (Kept as is) ---
            $lastAppointmentNumber = Appointment::query()
                ->whereDate('appointment_date', $appointmentDate)
                ->orderByDesc('appointment_number')
                ->lockForUpdate()
                ->value('appointment_number');

            $nextAppointmentNumber = ((int) ($lastAppointmentNumber ?? 0)) + 1;

            // --- CREATE APPOINTMENT ---
            $appointment = Appointment::create([
                'patient_id' => $patientId,
                'doctor_id' => $validated['doctor_id'] ?? null,
                'department_id' => $validated['department_id'] ?? null, // <--- ADDED THIS LINE
                'clinic' => 'OPD',
                'appointment_number' => $nextAppointmentNumber,
                'appointment_date' => $appointmentDate,
                'appointment_time' => $validated['appointment_time'],
                'type' => $validated['type'] ?? 'in_person',
                'status' => $validated['status'] ?? 'scheduled',
                'is_walk_in' => $isWalkIn,
                'reason' => $validated['reason'] ?? null,
                'notes' => $validated['notes'] ?? null,
                'confirmed_at' => now(),
            ]);

            // --- QUEUE GENERATION (Kept as is) ---
            $queueDate = $appointmentDate;
            $alreadyInQueue = QueueEntry::query()
                ->where('appointment_id', $appointment->id)
                ->whereDate('queue_date', $queueDate)
                ->whereIn('status', ['waiting', 'in_consultation', 'completed'])
                ->exists();

            $queueEntry = null;

            if (! $alreadyInQueue) {
                $doctorId = $appointment->doctor_id;

                $lastQueueNumber = QueueEntry::query()
                    ->whereDate('queue_date', $queueDate)
                    ->where(function ($q) use ($doctorId) {
                        if ($doctorId) {
                            $q->where('doctor_id', $doctorId);
                        } else {
                            $q->whereNull('doctor_id');
                        }
                    })
                    ->orderByDesc('queue_number')
                    ->lockForUpdate()
                    ->value('queue_number');

                $nextQueueNumber = ((int) ($lastQueueNumber ?? 0)) + 1;

                $queueEntry = QueueEntry::create([
                    'appointment_id' => $appointment->id,
                    'patient_id' => $patientId,
                    'doctor_id' => $doctorId,
                    'queue_date' => $queueDate,
                    'queue_number' => $nextQueueNumber,
                    'status' => 'waiting',
                    'priority' => 'normal',
                    'checked_in_at' => now(),
                    'created_by' => $request->user()?->id,
                ]);
            }

            return response()->json([
                'appointment' => $appointment->load(['patient', 'doctor', 'department']),
                'queue_entry' => $queueEntry?->load(['patient', 'doctor', 'appointment']),
            ], 201);
        });
    }

    public function show(int $id)
    {
        $appointment = Appointment::query()
            ->with([
                'patient:id,first_name,last_name,email,username,is_active',
                'doctor:id,first_name,last_name,email,username,is_active',
                'department'
            ])
            ->findOrFail($id);

        return response()->json($appointment);
    }

    public function update(Request $request, int $id)
    {
        $appointment = Appointment::findOrFail($id);

        $validated = $request->validate([
            'patient_id' => ['sometimes', 'max:50'],
            'doctor_id' => ['nullable', 'integer', 'exists:users,id'],
            'department_id' => ['nullable', 'integer', 'exists:departments,id'], // <--- ADDED VALIDATION
            'appointment_date' => ['sometimes', 'date'],
            'appointment_time' => ['sometimes'],
            'type' => ['sometimes', Rule::in(['in_person', 'telemedicine'])],
            'status' => ['sometimes', Rule::in(['scheduled', 'completed', 'cancelled'])],
            'reason' => ['nullable', 'string'],
            'notes' => ['nullable', 'string'],
        ]);

        if (empty($appointment->clinic)) {
            $appointment->clinic = 'OPD';
        }

        // --- PATIENT ID UPDATE LOGIC (Kept as is) ---
        if (array_key_exists('patient_id', $validated)) {
            $patientId = null;
            $rawPatientIdOrCode = trim((string) ($validated['patient_id'] ?? ''));

            if ($rawPatientIdOrCode === '') {
                return response()->json(['message' => 'Patient id is required.'], 422);
            }

            if (ctype_digit($rawPatientIdOrCode) && User::query()->whereKey((int) $rawPatientIdOrCode)->exists()) {
                $patientId = (int) $rawPatientIdOrCode;
            } else {
                $profile = PatientProfile::query()
                    ->where('patient_id', $rawPatientIdOrCode)
                    ->with('user')
                    ->first();

                if (! $profile || ! $profile->user) {
                    return response()->json(['message' => 'Patient not found for provided patient id.'], 422);
                }
                $patientId = $profile->user->id;
            }
            $validated['patient_id'] = $patientId;
        }

        // --- CONFLICT CHECK (Kept as is) ---
        $nextDoctorId = array_key_exists('doctor_id', $validated) ? $validated['doctor_id'] : $appointment->doctor_id;
        $nextDate = $validated['appointment_date'] ?? $appointment->appointment_date;
        $nextTime = $validated['appointment_time'] ?? $appointment->appointment_time;
        $nextStatus = $validated['status'] ?? $appointment->status;

        if (! empty($nextDoctorId) && $nextStatus === 'scheduled') {
            $conflict = Appointment::query()
                ->where('doctor_id', $nextDoctorId)
                ->whereDate('appointment_date', $nextDate)
                ->where('appointment_time', $nextTime)
                ->where('status', 'scheduled')
                ->where('id', '!=', $appointment->id)
                ->exists();

            if ($conflict) {
                return response()->json([
                    'message' => 'Appointment conflict: doctor is already booked for this time slot.',
                ], 422);
            }
        }

        $appointment->update($validated);

        return response()->json($appointment->fresh()->load(['patient', 'doctor', 'department']));
    }

    public function confirm(int $id)
    {
        $appointment = Appointment::findOrFail($id);

        if ($appointment->status !== 'scheduled') {
            return response()->json([
                'message' => 'Only scheduled appointments can be confirmed.',
            ], 422);
        }

        if ($appointment->confirmed_at !== null) {
            return response()->json($appointment->load(['patient', 'doctor', 'department']));
        }

        $appointment->confirmed_at = now();
        $appointment->save();

        return response()->json($appointment->fresh()->load(['patient', 'doctor', 'department']));
    }

    public function destroy(int $id)
    {
        return DB::transaction(function () use ($id) {
            $appointment = Appointment::findOrFail($id);

            QueueEntry::query()
                ->where('appointment_id', $appointment->id)
                ->delete();

            $appointment->delete();

            return response()->json([
                'message' => 'Appointment deleted successfully',
            ]);
        });
    }
}