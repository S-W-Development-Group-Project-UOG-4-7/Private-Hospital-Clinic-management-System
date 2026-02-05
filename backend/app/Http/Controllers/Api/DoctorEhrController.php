<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\EhrRecord;
use App\Models\User;
use Illuminate\Http\Request;

class DoctorEhrController extends Controller
{
    public function getPatientEhr(Request $request, int $patientId)
    {
        // 1. Verify patient exists (Use find to handle errors gracefully)
        $patient = User::find($patientId);

        if (!$patient) {
            return response()->json(['message' => 'Patient not found'], 404);
        }

        // 2. Get all EHR records for the patient
        $ehrRecords = EhrRecord::query()
            ->where('patient_id', $patientId)
            ->with(['doctor:id,first_name,last_name,email']) // Load doctor details
            ->orderBy('created_at', 'desc') // Show newest first
            ->get();

        // 3. Return JSON
        return response()->json([
            'status' => 'success',
            'patient' => [
                'id' => $patient->id,
                // Fix: Concatenate names if 'name' column doesn't exist
                'name' => $patient->first_name . ' ' . $patient->last_name,
                'email' => $patient->email,
            ],
            // Fix: Rename key to 'records' to match your Frontend code
            'records' => $ehrRecords,
        ]);
    }
}
