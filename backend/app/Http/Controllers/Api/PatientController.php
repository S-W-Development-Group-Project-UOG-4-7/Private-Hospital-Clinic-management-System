<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\User;
use App\Models\PatientProfile;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class PatientController extends Controller
{
    /**
     * Search patient by phone number
     */
    public function searchByPhone(Request $request): JsonResponse
    {
        $request->validate([
            'phone' => 'required|string|max:30',
            'name' => 'nullable|string|max:100'
        ]);

        $phone = $request->input('phone');
        $name = $request->input('name');

        $normalized = preg_replace('/\D+/', '', (string) $phone);
        if (strlen($normalized) < 7) {
            return response()->json([
                'data' => null,
                'message' => 'Phone number is too short'
            ], 422);
        }

        $driver = DB::connection()->getDriverName();

        $patientId = null;

        $profileColumns = [
            'phone' => Schema::hasColumn('patient_profiles', 'phone'),
            'guardian_phone' => Schema::hasColumn('patient_profiles', 'guardian_phone'),
            'emergency_contact_phone' => Schema::hasColumn('patient_profiles', 'emergency_contact_phone'),
        ];

        if ($driver === 'pgsql') {
            $patientId = PatientProfile::query()
                ->when($profileColumns['phone'], fn ($q) => $q->orWhereRaw("regexp_replace(phone, '\\\\D', '', 'g') = ?", [$normalized]))
                ->when($profileColumns['guardian_phone'], fn ($q) => $q->orWhereRaw("regexp_replace(guardian_phone, '\\\\D', '', 'g') = ?", [$normalized]))
                ->when($profileColumns['emergency_contact_phone'], fn ($q) => $q->orWhereRaw("regexp_replace(emergency_contact_phone, '\\\\D', '', 'g') = ?", [$normalized]))
                ->value('user_id');
        } else {
            $patientId = PatientProfile::query()
                ->when($profileColumns['phone'], fn ($q) => $q->orWhere('phone', $phone))
                ->when($profileColumns['guardian_phone'], fn ($q) => $q->orWhere('guardian_phone', $phone))
                ->when($profileColumns['emergency_contact_phone'], fn ($q) => $q->orWhere('emergency_contact_phone', $phone))
                ->value('user_id');
        }

        if (!$patientId) {
            if ($driver === 'pgsql') {
                $patientId = User::query()
                    ->whereRaw("regexp_replace(phone, '\\\\D', '', 'g') = ?", [$normalized])
                    ->value('id');
            } else {
                $patientId = User::query()
                    ->where('phone', $phone)
                    ->value('id');
            }
        }

        if (!$patientId) {
            return response()->json([
                'data' => null,
                'message' => 'No patient found with this phone number'
            ], 404);
        }

        // Get the user associated with this patient profile
        $user = User::with([
            'patientProfile',
            'prescriptions' => function ($query) {
                $query->with([
                    'doctor:id,first_name,last_name',
                    'items.inventoryItem:id,name,brand_name,generic_name'
                ])->orderBy('created_at', 'desc');
            },
            'clinicReferrals' => function ($query) {
                $query->with('clinic:id,name,location')
                    ->orderBy('created_at', 'desc');
            },
            'appointments' => function ($query) {
                $query->with('doctor:id,first_name,last_name')
                    ->orderBy('appointment_date', 'desc')
                    ->orderBy('appointment_time', 'desc');
            },
        ])->find($patientId);

        if (!$user) {
            return response()->json([
                'data' => null,
                'message' => 'Patient record not found'
            ], 404);
        }

        // Optional name validation
        if ($name) {
            $fullName = strtolower($user->first_name . ' ' . $user->last_name);
            if (strpos($fullName, strtolower($name)) === false) {
                return response()->json([
                    'data' => null,
                    'message' => 'Name does not match the patient record'
                ], 404);
            }
        }

        // Get lab orders for this patient
        $labOrders = \App\Models\LabOrder::where('patient_id', $user->id)
            ->with('doctor:id,first_name,last_name')
            ->orderBy('created_at', 'desc')
            ->get();

        // Get the last completed appointment (last consulting date)
        $lastConsultation = $user->appointments()
            ->where('status', Appointment::STATUS_COMPLETED)
            ->orderBy('appointment_date', 'desc')
            ->orderBy('appointment_time', 'desc')
            ->first();

        // Transform the data for the frontend
        $patientRecord = [
            'id' => $user->id,
            'first_name' => $user->first_name,
            'last_name' => $user->last_name,
            'email' => $user->email,
            'patient_profile' => $user->patientProfile ? [
                'phone' => $user->patientProfile->phone,
                'date_of_birth' => $user->patientProfile->date_of_birth,
                'gender' => $user->patientProfile->gender,
                'address' => $user->patientProfile->address,
                'blood_type' => $user->patientProfile->blood_type,
                'city' => $user->patientProfile->city,
                'state' => $user->patientProfile->state,
                'guardian_name' => $user->patientProfile->guardian_name,
                'guardian_phone' => $user->patientProfile->guardian_phone,
                'emergency_contact_name' => $user->patientProfile->emergency_contact_name,
                'emergency_contact_phone' => $user->patientProfile->emergency_contact_phone,
                'emergency_contact_relationship' => $user->patientProfile->emergency_contact_relationship,
                'allergies' => $user->patientProfile->allergies,
                'medical_conditions' => $user->patientProfile->medical_conditions,
            ] : null,
            'last_consultation' => $lastConsultation ? [
                'date' => $lastConsultation->appointment_date,
                'time' => $lastConsultation->appointment_time,
                'doctor_name' => $lastConsultation->doctor 
                    ? $lastConsultation->doctor->first_name . ' ' . $lastConsultation->doctor->last_name 
                    : 'Unknown Doctor',
                'reason' => $lastConsultation->reason,
            ] : null,
            'prescriptions' => $this->transformPrescriptions($user->prescriptions),
            'lab_orders' => $labOrders->map(function ($order) {
                return [
                    'id' => $order->id,
                    'test_type' => $order->test_type,
                    'test_description' => $order->test_description,
                    'status' => $order->status ?? 'pending',
                    'order_date' => $order->order_date,
                    'due_date' => $order->due_date,
                    'result_date' => $order->result_date,
                    'result_value' => $order->result_value,
                    'result_unit' => $order->result_unit,
                    'notes' => $order->notes,
                    'instructions' => $order->instructions,
                    'doctor_name' => $order->doctor 
                        ? $order->doctor->first_name . ' ' . $order->doctor->last_name 
                        : 'Unknown Doctor',
                ];
            })->toArray(),
            'clinic_referrals' => $user->clinicReferrals->map(function ($referral) {
                return [
                    'id' => $referral->id,
                    'clinic_name' => $referral->clinic ? $referral->clinic->name : 'Unknown Clinic',
                    'clinic_location' => $referral->clinic ? $referral->clinic->location : null,
                    'reason' => $referral->reason,
                    'priority' => $referral->priority,
                    'status' => $referral->status ?? 'pending',
                    'preferred_appointment_date' => $referral->preferred_appointment_date,
                    'created_at' => $referral->created_at->toISOString(),
                ];
            })->toArray(),
        ];

        return response()->json([
            'data' => $patientRecord,
            'message' => 'Patient record found successfully'
        ]);
    }

    /**
     * Transform prescriptions data for frontend
     */
    private function transformPrescriptions($prescriptions)
    {
        $transformedPrescriptions = [];
        
        foreach ($prescriptions as $prescription) {
            // Group prescription items by medication name if they have the same medicine
            foreach ($prescription->items as $item) {
                $medicationName = $item->inventoryItem ? 
                    ($item->inventoryItem->brand_name ?: $item->inventoryItem->name) : 
                    'Unknown Medication';
                
                $transformedPrescriptions[] = [
                    'id' => $item->id,
                    'prescription_id' => $prescription->id,
                    'medication_name' => $medicationName,
                    'dosage' => $item->dosage ?? 'N/A',
                    'frequency' => $item->frequency ?? 'N/A', 
                    'duration' => $item->duration_days ? $item->duration_days . ' days' : 'N/A',
                    'instructions' => $item->instructions,
                    'status' => $item->is_dispensed ? 'dispensed' : ($prescription->status ?? 'pending'),
                    'prescribed_date' => $prescription->created_at->toDateString(),
                    'doctor_name' => $prescription->doctor 
                        ? $prescription->doctor->first_name . ' ' . $prescription->doctor->last_name 
                        : 'Unknown Doctor',
                    'quantity' => $item->quantity,
                ];
            }
        }
        
        return $transformedPrescriptions;
    }

    /**
     * Get patient details by ID
     */
    public function show(Request $request, $id): JsonResponse
    {
        $user = User::with([
            'patientProfile',
            'prescriptions' => function ($query) {
                $query->with([
                    'doctor:id,first_name,last_name',
                    'items.inventoryItem:id,name,brand_name,generic_name'
                ])->orderBy('created_at', 'desc');
            },
            'clinicReferrals' => function ($query) {
                $query->with('clinic:id,name,location')
                    ->orderBy('created_at', 'desc');
            }
        ])->find($id);

        if (!$user || !$user->hasRole('patient')) {
            return response()->json([
                'data' => null,
                'message' => 'Patient not found'
            ], 404);
        }

        // Transform the data for the frontend (same as searchByPhone)
        $patientRecord = [
            'id' => $user->id,
            'first_name' => $user->first_name,
            'last_name' => $user->last_name,
            'email' => $user->email,
            'patient_profile' => $user->patientProfile ? [
                'phone' => $user->patientProfile->phone,
                'date_of_birth' => $user->patientProfile->date_of_birth,
                'gender' => $user->patientProfile->gender,
                'address' => $user->patientProfile->address,
                'blood_type' => $user->patientProfile->blood_type,
                'city' => $user->patientProfile->city,
                'state' => $user->patientProfile->state,
                'guardian_name' => $user->patientProfile->guardian_name,
                'guardian_phone' => $user->patientProfile->guardian_phone,
                'emergency_contact_name' => $user->patientProfile->emergency_contact_name,
                'emergency_contact_phone' => $user->patientProfile->emergency_contact_phone,
                'emergency_contact_relationship' => $user->patientProfile->emergency_contact_relationship,
                'allergies' => $user->patientProfile->allergies,
                'medical_conditions' => $user->patientProfile->medical_conditions,
            ] : null,
            'prescriptions' => $this->transformPrescriptions($user->prescriptions),
            'clinic_referrals' => $user->clinicReferrals->map(function ($referral) {
                return [
                    'id' => $referral->id,
                    'clinic_name' => $referral->clinic ? $referral->clinic->name : 'Unknown Clinic',
                    'clinic_location' => $referral->clinic ? $referral->clinic->location : null,
                    'reason' => $referral->reason,
                    'priority' => $referral->priority,
                    'status' => $referral->status ?? 'pending',
                    'preferred_appointment_date' => $referral->preferred_appointment_date,
                    'created_at' => $referral->created_at->toISOString(),
                ];
            })->toArray(),
        ];

        return response()->json([
            'data' => $patientRecord,
            'message' => 'Patient record retrieved successfully'
        ]);
    }
}
