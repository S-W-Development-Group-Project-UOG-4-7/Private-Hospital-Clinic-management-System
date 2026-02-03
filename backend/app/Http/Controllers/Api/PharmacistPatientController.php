<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Prescription;
use App\Models\PrescriptionItem;
use App\Models\Invoice;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PharmacistPatientController extends Controller
{
    /**
     * Get list of patients who have prescriptions (basic view for pharmacist).
     * This provides limited patient information relevant to pharmacy operations.
     */
    public function index(Request $request)
    {
        $query = User::whereHas('roles', function ($q) {
            $q->where('name', 'patient');
        })->whereHas('prescriptionsAsPatient')
          ->with(['patientProfile', 'prescriptionsAsPatient' => function ($q) {
              $q->latest()->limit(5);
          }]);

        // Search by name or email
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                  ->orWhere('last_name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('username', 'like', "%{$search}%");
            });
        }

        $patients = $query->orderBy('first_name')->paginate(20);

        // Transform to basic patient info
        $transformedPatients = $patients->getCollection()->map(function ($patient) {
            $profile = $patient->patientProfile;
            $lastPrescription = $patient->prescriptionsAsPatient->first();
            $totalPrescriptions = Prescription::where('patient_id', $patient->id)->count();
            $pendingPrescriptions = Prescription::where('patient_id', $patient->id)
                ->where('status', 'pending')->count();

            return [
                'id' => $patient->id,
                'name' => $patient->name,
                'first_name' => $patient->first_name,
                'last_name' => $patient->last_name,
                'email' => $patient->email,
                'phone' => $profile?->phone ?? null,
                'date_of_birth' => $profile?->date_of_birth ?? null,
                'age' => $profile?->age ?? null,
                'gender' => $profile?->gender ?? null,
                'blood_type' => $profile?->blood_type ?? null,
                'allergies' => $profile?->allergies ?? null,
                'total_prescriptions' => $totalPrescriptions,
                'pending_prescriptions' => $pendingPrescriptions,
                'last_prescription_date' => $lastPrescription?->created_at ?? null,
            ];
        });

        $patients->setCollection($transformedPatients);

        return response()->json($patients);
    }

    /**
     * Get basic patient info by ID.
     */
    public function show($id)
    {
        $patient = User::whereHas('roles', function ($q) {
            $q->where('name', 'patient');
        })->with('patientProfile')->findOrFail($id);

        $profile = $patient->patientProfile;
        $totalPrescriptions = Prescription::where('patient_id', $patient->id)->count();
        $dispensedPrescriptions = Prescription::where('patient_id', $patient->id)
            ->where('status', 'dispensed')->count();
        $pendingPrescriptions = Prescription::where('patient_id', $patient->id)
            ->where('status', 'pending')->count();

        return response()->json([
            'id' => $patient->id,
            'name' => $patient->name,
            'first_name' => $patient->first_name,
            'last_name' => $patient->last_name,
            'email' => $patient->email,
            'phone' => $profile?->phone ?? null,
            'date_of_birth' => $profile?->date_of_birth ?? null,
            'age' => $profile?->age ?? null,
            'gender' => $profile?->gender ?? null,
            'blood_type' => $profile?->blood_type ?? null,
            'address' => $profile?->address ?? null,
            'city' => $profile?->city ?? null,
            'allergies' => $profile?->allergies ?? null,
            'total_prescriptions' => $totalPrescriptions,
            'dispensed_prescriptions' => $dispensedPrescriptions,
            'pending_prescriptions' => $pendingPrescriptions,
        ]);
    }

    /**
     * Get medication history for a specific patient.
     * Shows all dispensed prescriptions with medication details.
     */
    public function medicationHistory($patientId, Request $request)
    {
        // Verify patient exists
        $patient = User::whereHas('roles', function ($q) {
            $q->where('name', 'patient');
        })->findOrFail($patientId);

        $query = Prescription::where('patient_id', $patientId)
            ->with(['doctor', 'pharmacist', 'items.inventoryItem'])
            ->orderBy('created_at', 'desc');

        // Filter by status
        if ($request->has('status') && $request->status) {
            $query->where('status', $request->status);
        }

        // Filter by date range
        if ($request->has('from_date') && $request->from_date) {
            $query->whereDate('created_at', '>=', $request->from_date);
        }
        if ($request->has('to_date') && $request->to_date) {
            $query->whereDate('created_at', '<=', $request->to_date);
        }

        $prescriptions = $query->paginate(20);

        // Transform prescriptions to medication history format
        $transformedPrescriptions = $prescriptions->getCollection()->map(function ($prescription) {
            $medications = $prescription->items->map(function ($item) {
                return [
                    'id' => $item->id,
                    'medication_name' => $item->inventoryItem?->name ?? $item->medication_name ?? 'Unknown',
                    'generic_name' => $item->inventoryItem?->generic_name ?? null,
                    'dosage' => $item->dosage,
                    'frequency' => $item->frequency,
                    'duration_days' => $item->duration_days,
                    'quantity' => $item->quantity,
                    'instructions' => $item->instructions,
                    'unit_price' => $item->unit_price,
                    'total_price' => $item->total_price,
                    'is_dispensed' => $item->is_dispensed ?? false,
                ];
            });

            return [
                'id' => $prescription->id,
                'prescription_number' => $prescription->prescription_number,
                'status' => $prescription->status,
                'doctor_name' => $prescription->doctor?->name ?? 'Unknown',
                'pharmacist_name' => $prescription->pharmacist?->name ?? null,
                'prescription_date' => $prescription->prescription_date ?? $prescription->created_at,
                'dispensed_at' => $prescription->dispensed_at,
                'notes' => $prescription->notes,
                'medications' => $medications,
                'total_amount' => $medications->sum('total_price'),
            ];
        });

        $prescriptions->setCollection($transformedPrescriptions);

        return response()->json([
            'patient' => [
                'id' => $patient->id,
                'name' => $patient->name,
            ],
            'prescriptions' => $prescriptions,
        ]);
    }

    /**
     * Get medication summary for a patient (current and past medications).
     */
    public function medicationSummary($patientId)
    {
        $patient = User::whereHas('roles', function ($q) {
            $q->where('name', 'patient');
        })->findOrFail($patientId);

        // Get all unique medications prescribed to this patient
        $medications = PrescriptionItem::whereHas('prescription', function ($q) use ($patientId) {
            $q->where('patient_id', $patientId);
        })
        ->with('inventoryItem')
        ->get()
        ->groupBy(function ($item) {
            return $item->inventoryItem?->id ?? $item->id;
        })
        ->map(function ($items) {
            $first = $items->first();
            $inventoryItem = $first->inventoryItem;
            
            return [
                'medication_id' => $inventoryItem?->id ?? null,
                'medication_name' => $inventoryItem?->name ?? 'Unknown',
                'generic_name' => $inventoryItem?->generic_name ?? null,
                'category' => $inventoryItem?->category ?? null,
                'times_prescribed' => $items->count(),
                'total_quantity' => $items->sum('quantity'),
                'last_prescribed' => $items->max('created_at'),
                'first_prescribed' => $items->min('created_at'),
            ];
        })
        ->values();

        return response()->json([
            'patient' => [
                'id' => $patient->id,
                'name' => $patient->name,
            ],
            'medications' => $medications,
            'total_unique_medications' => $medications->count(),
        ]);
    }
}
