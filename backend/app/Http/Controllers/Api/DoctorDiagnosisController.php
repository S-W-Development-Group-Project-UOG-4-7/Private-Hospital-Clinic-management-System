<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Diagnosis;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class DoctorDiagnosisController extends Controller
{
    public function store(Request $request)
    {
        $doctor = $request->user();

        $validated = $request->validate([
            'patient_id' => ['required', 'integer', 'exists:users,id'],
            'appointment_id' => ['nullable', 'integer', 'exists:appointments,id'],
            'icd10_code' => ['nullable', 'string', 'max:20'],
            'icd10_description' => ['nullable', 'string', 'max:500'],
            'diagnosis_name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:2000'],
            'status' => ['nullable', Rule::in(['active', 'resolved', 'chronic'])],
            'diagnosis_date' => ['required', 'date'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ]);

        $diagnosis = Diagnosis::create([
            'patient_id' => $validated['patient_id'],
            'doctor_id' => $doctor->id,
            'appointment_id' => $validated['appointment_id'] ?? null,
            'icd10_code' => $validated['icd10_code'] ?? null,
            'icd10_description' => $validated['icd10_description'] ?? null,
            'diagnosis_name' => $validated['diagnosis_name'],
            'description' => $validated['description'] ?? null,
            'status' => $validated['status'] ?? 'active',
            'diagnosis_date' => $validated['diagnosis_date'],
            'notes' => $validated['notes'] ?? null,
        ]);

        return response()->json($diagnosis->load(['patient', 'doctor', 'appointment']), 201);
    }

    public function update(Request $request, int $id)
    {
        $doctor = $request->user();

        $diagnosis = Diagnosis::where('doctor_id', $doctor->id)->findOrFail($id);

        $validated = $request->validate([
            'icd10_code' => ['nullable', 'string', 'max:20'],
            'icd10_description' => ['nullable', 'string', 'max:500'],
            'diagnosis_name' => ['sometimes', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:2000'],
            'status' => ['sometimes', Rule::in(['active', 'resolved', 'chronic'])],
            'resolved_date' => ['nullable', 'date'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ]);

        $diagnosis->update($validated);

        return response()->json($diagnosis->load(['patient', 'doctor', 'appointment']));
    }

    public function getPatientDiagnoses(Request $request, int $patientId)
    {
        $doctor = $request->user();

        $diagnoses = Diagnosis::query()
            ->where('patient_id', $patientId)
            ->with(['doctor:id,first_name,last_name,email', 'appointment:id,appointment_date'])
            ->orderBy('diagnosis_date', 'desc')
            ->get();

        return response()->json(['data' => $diagnoses]);
    }
}

