<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Clinic;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class DoctorClinicReferralController extends Controller
{
    /**
     * Store a new clinic referral
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'patient_id' => 'required|integer|exists:users,id',
            'clinic_id' => 'required|integer|exists:clinics,id',
            'reason' => 'required|string|max:1000',
            'clinical_summary' => 'nullable|string|max:2000',
            'notes' => 'nullable|string|max:1000',
            'priority' => 'required|in:low,medium,high,urgent',
            'preferred_appointment_date' => 'nullable|date|after:now',
        ]);

        $doctor = Auth::user();
        $clinic = Clinic::findOrFail($request->clinic_id);

        try {
            // Create clinic referral record
            $referral = DB::table('clinic_referrals')->insertGetId([
                'patient_id' => $request->patient_id,
                'clinic_id' => $request->clinic_id,
                'referring_doctor_id' => $doctor->id,
                'reason' => $request->reason,
                'clinical_summary' => $request->clinical_summary,
                'notes' => $request->notes,
                'priority' => $request->priority,
                'preferred_appointment_date' => $request->preferred_appointment_date,
                'status' => 'pending',
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // You could also create an actual appointment here if needed
            // or send a notification to the clinic

            return response()->json([
                'success' => true,
                'message' => "Patient successfully referred to {$clinic->name}",
                'data' => [
                    'referral_id' => $referral,
                    'clinic_name' => $clinic->name,
                    'status' => 'pending',
                    'created_at' => now()->toISOString()
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create clinic referral',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * List clinic referrals for the authenticated doctor
     */
    public function index(Request $request): JsonResponse
    {
        $doctor = Auth::user();
        
        $query = DB::table('clinic_referrals')
            ->select([
                'clinic_referrals.*',
                'clinics.name as clinic_name',
                'clinics.location as clinic_location',
                'users.first_name',
                'users.last_name',
                'users.email'
            ])
            ->join('clinics', 'clinic_referrals.clinic_id', '=', 'clinics.id')
            ->join('users', 'clinic_referrals.patient_id', '=', 'users.id')
            ->where('clinic_referrals.referring_doctor_id', $doctor->id)
            ->orderBy('clinic_referrals.created_at', 'desc');

        if ($request->filled('status')) {
            $query->where('clinic_referrals.status', $request->status);
        }

        if ($request->filled('clinic_id')) {
            $query->where('clinic_referrals.clinic_id', $request->clinic_id);
        }

        if ($request->filled('priority')) {
            $query->where('clinic_referrals.priority', $request->priority);
        }

        $referrals = $query->get();

        return response()->json([
            'success' => true,
            'data' => $referrals
        ]);
    }
}