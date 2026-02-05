<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\LabOrder;
use App\Models\LabResult;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Validator;

class DoctorLabController extends Controller
{
    public function index(Request $request)
    {
        $doctor = $request->user();

        $query = LabOrder::query()
            ->where('doctor_id', $doctor->id)
            ->with(['patient:id,first_name,last_name,email', 'clinic:id,name'])
            ->orderBy('order_date', 'desc');

        if ($request->has('patient_id')) {
            $query->where('patient_id', $request->patient_id);
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        return response()->json(['data' => $query->get()]);
    }

    public function show(Request $request, int $id)
    {
        $doctor = $request->user();

        $labOrder = LabOrder::query()
            ->where('doctor_id', $doctor->id)
            ->with(['patient:id,first_name,last_name,email', 'clinic:id,name', 'results'])
            ->findOrFail($id);

        return response()->json($labOrder);
    }

    public function createOrder(Request $request)
    {
        $doctor = $request->user();

        $validated = $request->validate([
            'patient_id' => ['required', 'integer', 'exists:users,id'],
            'appointment_id' => ['nullable', 'integer', 'exists:appointments,id'],
            'clinic_id' => ['nullable', 'integer', 'exists:clinics,id'],
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
            'clinic_id' => $validated['clinic_id'] ?? null,
            'appointment_id' => $validated['appointment_id'] ?? null,
            'test_type' => $validated['test_type'],
            'test_description' => $validated['test_description'] ?? null,
            'status' => 'pending',
            'order_date' => $validated['order_date'],
            'due_date' => $validated['due_date'] ?? null,
            'notes' => $validated['notes'] ?? null,
            'instructions' => $validated['instructions'] ?? null,
        ]);

        return response()->json($labOrder->load(['patient', 'doctor', 'clinic']), 201);
    }

    public function updateOrder(Request $request, int $id)
    {
        $doctor = $request->user();

        $labOrder = LabOrder::query()
            ->where('doctor_id', $doctor->id)
            ->findOrFail($id);

        $validator = Validator::make($request->all(), [
            'patient_id' => ['nullable', 'integer', 'exists:users,id'],
            'appointment_id' => ['nullable', 'integer', 'exists:appointments,id'],
            'clinic_id' => ['nullable', 'integer', 'exists:clinics,id'],
            'test_type' => ['nullable', 'string', 'max:255'],
            'test_description' => ['nullable', 'string', 'max:2000'],
            'order_date' => ['nullable', 'date'],
            'due_date' => ['nullable', 'date'],
            'notes' => ['nullable', 'string', 'max:2000'],
            'instructions' => ['nullable', 'string', 'max:2000'],
            'status' => ['nullable', Rule::in(['pending', 'in_progress', 'completed', 'cancelled'])],
        ]);

        $validated = $validator->validate();

        $orderDate = $validated['order_date'] ?? $labOrder->order_date;
        if (!empty($validated['due_date']) && $orderDate && strtotime($validated['due_date']) < strtotime($orderDate)) {
            return response()->json([
                'message' => 'The due date must be on or after the order date.',
                'errors' => ['due_date' => ['The due date must be on or after the order date.']],
            ], 422);
        }

        $labOrder->update([
            'patient_id' => $validated['patient_id'] ?? $labOrder->patient_id,
            'appointment_id' => $validated['appointment_id'] ?? $labOrder->appointment_id,
            'clinic_id' => $validated['clinic_id'] ?? $labOrder->clinic_id,
            'test_type' => $validated['test_type'] ?? $labOrder->test_type,
            'test_description' => $validated['test_description'] ?? $labOrder->test_description,
            'order_date' => $validated['order_date'] ?? $labOrder->order_date,
            'due_date' => $validated['due_date'] ?? $labOrder->due_date,
            'notes' => $validated['notes'] ?? $labOrder->notes,
            'instructions' => $validated['instructions'] ?? $labOrder->instructions,
            'status' => $validated['status'] ?? $labOrder->status,
        ]);

        return response()->json($labOrder->fresh()->load(['patient', 'doctor', 'clinic', 'results']));
    }

    public function destroyOrder(Request $request, int $id)
    {
        $doctor = $request->user();

        $labOrder = LabOrder::query()
            ->where('doctor_id', $doctor->id)
            ->findOrFail($id);

        $labOrder->delete();

        return response()->json(['message' => 'Lab order deleted successfully']);
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
            ->with(['results', 'doctor:id,first_name,last_name,email', 'clinic:id,name'])
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
