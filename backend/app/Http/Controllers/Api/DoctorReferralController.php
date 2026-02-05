<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\Referral;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class DoctorReferralController extends Controller
{
    public function store(Request $request)
    {
        $doctor = $request->user();

        $validated = $request->validate([
            'patient_id' => ['required', 'integer', 'exists:users,id'],
            'referred_doctor_id' => ['nullable', 'integer', 'exists:users,id'],
            'to_department_id' => ['nullable', 'integer', 'exists:departments,id'],
            'clinic_id' => ['nullable', 'integer', 'exists:clinics,id'],
            'reason' => ['required', 'string', 'max:2000'],
            'notes' => ['nullable', 'string', 'max:2000'],
            'referred_at' => ['nullable', 'date'],
        ]);

        $assigned = Appointment::query()
            ->where('doctor_id', $doctor->id)
            ->where('patient_id', (int) $validated['patient_id'])
            ->exists();

        if (! $assigned) {
            return response()->json(['message' => 'Not authorized to refer this patient.'], 403);
        }

        // Generate referral number
        $referralNumber = 'REF-' . strtoupper(Str::random(8));

        $referral = Referral::create([
            'referral_number' => $referralNumber,
            'patient_id' => $validated['patient_id'],
            'referred_by_doctor_id' => $doctor->id,
            'referred_to_doctor_id' => $validated['referred_doctor_id'] ?? null,
            'to_department_id' => $validated['to_department_id'] ?? null,
            'clinic_id' => $validated['clinic_id'] ?? null,
            'status' => 'pending',
            'reason' => $validated['reason'],
            'notes' => $validated['notes'] ?? null,
            'referred_at' => $validated['referred_at'] ?? now()->toDateString(),
        ]);

        return response()->json($referral->load(['patient', 'referredByDoctor', 'referredToDoctor', 'toDepartment', 'clinic']), 201);
    }

    public function index(Request $request)
    {
        $doctor = $request->user();

        $query = Referral::query()
            ->where('referred_by_doctor_id', $doctor->id)
            ->with(['patient:id,first_name,last_name,email', 'referredToDoctor:id,first_name,last_name,email', 'toDepartment:id,name', 'clinic:id,name']);

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('patient_id')) {
            $query->where('patient_id', $request->patient_id);
        }

        $referrals = $query
            ->orderBy('referred_at', 'desc')
            ->get();

        return response()->json(['data' => $referrals]);
    }
}
