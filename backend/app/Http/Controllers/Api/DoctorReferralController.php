<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Referral;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class DoctorReferralController extends Controller
{
    public function store(Request $request)
    {
        $doctor = $request->user();

        $validated = $request->validate([
            'patient_id' => ['required', 'integer', 'exists:users,id'],
            'referred_doctor_id' => ['nullable', 'integer', 'exists:users,id'],
            'specialty' => ['nullable', 'string', 'max:255'],
            'reason' => ['required', 'string', 'max:2000'],
            'clinical_summary' => ['nullable', 'string', 'max:5000'],
            'notes' => ['nullable', 'string', 'max:2000'],
            'referral_date' => ['required', 'date'],
            'appointment_date' => ['nullable', 'date', 'after_or_equal:referral_date'],
        ]);

        // Generate referral number
        $referralNumber = 'REF-' . strtoupper(Str::random(8));

        $referral = Referral::create([
            'referral_number' => $referralNumber,
            'patient_id' => $validated['patient_id'],
            'referring_doctor_id' => $doctor->id,
            'referred_doctor_id' => $validated['referred_doctor_id'] ?? null,
            'specialty' => $validated['specialty'] ?? null,
            'status' => 'pending',
            'reason' => $validated['reason'],
            'clinical_summary' => $validated['clinical_summary'] ?? null,
            'notes' => $validated['notes'] ?? null,
            'referral_date' => $validated['referral_date'],
            'appointment_date' => $validated['appointment_date'] ?? null,
        ]);

        return response()->json($referral->load(['patient', 'referringDoctor', 'referredDoctor']), 201);
    }

    public function index(Request $request)
    {
        $doctor = $request->user();

        $query = Referral::query()
            ->where('referring_doctor_id', $doctor->id)
            ->with(['patient:id,first_name,last_name,email', 'referredDoctor:id,first_name,last_name,email']);

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('patient_id')) {
            $query->where('patient_id', $request->patient_id);
        }

        $referrals = $query
            ->orderBy('referral_date', 'desc')
            ->get();

        return response()->json(['data' => $referrals]);
    }
}

