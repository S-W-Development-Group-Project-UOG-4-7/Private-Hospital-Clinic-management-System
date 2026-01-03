<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\VitalSign;
use Illuminate\Http\Request;

class DoctorVitalSignController extends Controller
{
    public function store(Request $request)
    {
        $doctor = $request->user();

        $validated = $request->validate([
            'patient_id' => ['required', 'integer', 'exists:users,id'],
            'appointment_id' => ['nullable', 'integer', 'exists:appointments,id'],
            'blood_pressure_systolic' => ['nullable', 'numeric', 'min:0', 'max:300'],
            'blood_pressure_diastolic' => ['nullable', 'numeric', 'min:0', 'max:200'],
            'heart_rate' => ['nullable', 'integer', 'min:0', 'max:300'],
            'temperature' => ['nullable', 'numeric', 'min:0', 'max:120'],
            'weight' => ['nullable', 'numeric', 'min:0', 'max:1000'],
            'height' => ['nullable', 'numeric', 'min:0', 'max:300'],
            'respiratory_rate' => ['nullable', 'integer', 'min:0', 'max:100'],
            'oxygen_saturation' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'symptoms' => ['nullable', 'string', 'max:2000'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ]);

        $vitalSign = VitalSign::create([
            'patient_id' => $validated['patient_id'],
            'doctor_id' => $doctor->id,
            'appointment_id' => $validated['appointment_id'] ?? null,
            'blood_pressure_systolic' => $validated['blood_pressure_systolic'] ?? null,
            'blood_pressure_diastolic' => $validated['blood_pressure_diastolic'] ?? null,
            'heart_rate' => $validated['heart_rate'] ?? null,
            'temperature' => $validated['temperature'] ?? null,
            'weight' => $validated['weight'] ?? null,
            'height' => $validated['height'] ?? null,
            'respiratory_rate' => $validated['respiratory_rate'] ?? null,
            'oxygen_saturation' => $validated['oxygen_saturation'] ?? null,
            'symptoms' => $validated['symptoms'] ?? null,
            'notes' => $validated['notes'] ?? null,
            'recorded_at' => now(),
        ]);

        return response()->json($vitalSign->load(['patient', 'doctor', 'appointment']), 201);
    }

    public function update(Request $request, int $id)
    {
        $doctor = $request->user();

        $vitalSign = VitalSign::where('doctor_id', $doctor->id)->findOrFail($id);

        $validated = $request->validate([
            'blood_pressure_systolic' => ['nullable', 'numeric', 'min:0', 'max:300'],
            'blood_pressure_diastolic' => ['nullable', 'numeric', 'min:0', 'max:200'],
            'heart_rate' => ['nullable', 'integer', 'min:0', 'max:300'],
            'temperature' => ['nullable', 'numeric', 'min:0', 'max:120'],
            'weight' => ['nullable', 'numeric', 'min:0', 'max:1000'],
            'height' => ['nullable', 'numeric', 'min:0', 'max:300'],
            'respiratory_rate' => ['nullable', 'integer', 'min:0', 'max:100'],
            'oxygen_saturation' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'symptoms' => ['nullable', 'string', 'max:2000'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ]);

        $vitalSign->update($validated);

        return response()->json($vitalSign->load(['patient', 'doctor', 'appointment']));
    }

    public function destroy(Request $request, int $id)
    {
        $doctor = $request->user();

        $vitalSign = VitalSign::where('doctor_id', $doctor->id)->findOrFail($id);
        $vitalSign->delete();

        return response()->json(['message' => 'Vital sign record deleted successfully']);
    }
}

