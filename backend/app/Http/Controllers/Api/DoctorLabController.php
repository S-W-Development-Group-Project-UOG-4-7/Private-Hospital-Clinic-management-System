<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\LabOrder;
use App\Models\LabResult;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class DoctorLabController extends Controller
{
    public function createOrder(Request $request)
    {
        $doctor = $request->user();

        $validated = $request->validate([
            'patient_id' => ['required', 'integer', 'exists:users,id'],
            'appointment_id' => ['nullable', 'integer', 'exists:appointments,id'],
            'test_type' => ['required', 'string', 'max:255'],
            'test_description' => ['nullable', 'string', 'max:2000'],
            'order_date' => ['required', 'date'],
            'due_date' => ['nullable', 'date', 'after_or_equal:order_date'],
            'notes' => ['nullable', 'string', 'max:2000'],
            'instructions' => ['nullable', 'string', 'max:2000'],
        ]);

        // Generate order number
        $orderNumber = 'LAB-' . strtoupper(Str::random(8));

        $labOrder = LabOrder::create([
            'order_number' => $orderNumber,
            'patient_id' => $validated['patient_id'],
            'doctor_id' => $doctor->id,
            'appointment_id' => $validated['appointment_id'] ?? null,
            'test_type' => $validated['test_type'],
            'test_description' => $validated['test_description'] ?? null,
            'status' => 'pending',
            'order_date' => $validated['order_date'],
            'due_date' => $validated['due_date'] ?? null,
            'notes' => $validated['notes'] ?? null,
            'instructions' => $validated['instructions'] ?? null,
        ]);

        return response()->json($labOrder->load(['patient', 'doctor']), 201);
    }

    public function getPatientResults(Request $request, int $patientId)
    {
        $doctor = $request->user();

        $results = LabResult::query()
            ->where('patient_id', $patientId)
            ->with(['labOrder', 'doctor:id,first_name,last_name,email'])
            ->orderBy('result_date', 'desc')
            ->get();

        $orders = LabOrder::query()
            ->where('patient_id', $patientId)
            ->where('doctor_id', $doctor->id)
            ->with(['results'])
            ->orderBy('order_date', 'desc')
            ->get();

        return response()->json([
            'orders' => $orders,
            'results' => $results,
        ]);
    }

    public function reviewResult(Request $request, int $id)
    {
        $doctor = $request->user();

        $result = LabResult::findOrFail($id);

        $validated = $request->validate([
            'doctor_notes' => ['nullable', 'string', 'max:2000'],
        ]);

        $result->update([
            'doctor_id' => $doctor->id,
            'doctor_reviewed' => true,
            'reviewed_at' => now(),
            'doctor_notes' => $validated['doctor_notes'] ?? null,
        ]);

        return response()->json($result->load(['labOrder', 'doctor']));
    }
}

