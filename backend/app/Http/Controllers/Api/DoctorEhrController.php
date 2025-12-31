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
        $doctor = $request->user();

        // Verify patient exists
        $patient = User::findOrFail($patientId);

        // Get all EHR records for the patient
        $ehrRecords = EhrRecord::query()
            ->where('patient_id', $patientId)
            ->with(['doctor:id,first_name,last_name,email'])
            ->orderBy('record_date', 'desc')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'patient' => [
                'id' => $patient->id,
                'name' => $patient->name,
                'email' => $patient->email,
            ],
            'ehr_records' => $ehrRecords,
        ]);
    }
}

