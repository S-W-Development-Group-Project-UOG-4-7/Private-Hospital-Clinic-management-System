<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Prescription;
use App\Models\PrescriptionItem;
use App\Models\InventoryItem;
use App\Services\MedicationQuantityCalculator;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;

class DoctorPrescriptionController extends Controller
{
    public function store(Request $request)
    {
        $doctor = $request->user();
        
        // Log incoming request for debugging
        \Log::info('Prescription creation request', [
            'user_id' => $doctor->id,
            'request_data' => $request->all()
        ]);

        $validated = $request->validate([
            'patient_id' => ['required', 'integer', 'exists:users,id'],
            'appointment_id' => ['nullable', 'integer', 'exists:appointments,id'],
            'clinic_id' => ['nullable', 'integer', 'exists:clinics,id'],
            'prescription_date' => ['required', 'date'],
            'notes' => ['nullable', 'string', 'max:2000'],
            'instructions' => ['nullable', 'string', 'max:2000'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.inventory_item_id' => ['required', 'integer', 'exists:inventory_items,id'],
            'items.*.quantity' => ['nullable', 'integer', 'min:1'],
            'items.*.dosage' => ['nullable', 'string', 'max:100'],
            'items.*.frequency' => ['nullable', 'string', 'max:100'],
            'items.*.meal_timing' => ['nullable', 'string', 'max:100'],
            'items.*.duration_days' => ['nullable', 'integer', 'min:1'],
            'items.*.instructions' => ['nullable', 'string', 'max:500'],
        ]);

        DB::beginTransaction();
        try {
            // Generate prescription number
            $prescriptionNumber = 'RX-' . strtoupper(Str::random(8));

            $prescription = Prescription::create([
                'prescription_number' => $prescriptionNumber,
                'patient_id' => $validated['patient_id'],
                'doctor_id' => $doctor->id,
                'clinic_id' => $validated['clinic_id'] ?? null,
                'prescription_date' => $validated['prescription_date'],
                'status' => 'pending',
                'notes' => $validated['notes'] ?? null,
                'instructions' => $validated['instructions'] ?? null,
            ]);

            // Create prescription items
            foreach ($validated['items'] as $item) {
                $inventoryItem = InventoryItem::findOrFail($item['inventory_item_id']);
                
                $calculatedQuantity = MedicationQuantityCalculator::calculate(
                    $item['dosage'] ?? null,
                    $item['frequency'] ?? null,
                    $item['duration_days'] ?? null,
                    $item['quantity'] ?? null
                );
                $resolvedQuantity = (int) max(1, $calculatedQuantity ?? ($item['quantity'] ?? 1));

                PrescriptionItem::create([
                    'prescription_id' => $prescription->id,
                    'inventory_item_id' => $item['inventory_item_id'],
                    'quantity' => $resolvedQuantity,
                    'dosage' => $item['dosage'] ?? null,
                    'frequency' => $item['frequency'] ?? null,
                    'meal_timing' => $item['meal_timing'] ?? null,
                    'duration_days' => $item['duration_days'] ?? null,
                    'instructions' => $item['instructions'] ?? null,
                    'unit_price' => $inventoryItem->unit_price ?? 0,
                    'total_price' => ($inventoryItem->unit_price ?? 0) * $resolvedQuantity,
                ]);
            }

            DB::commit();

            return response()->json(
                $prescription->load([
                    'patient:id,first_name,last_name,email',
                    'patient.patientProfile:user_id,phone,guardian_phone',
                    'doctor',
                    'clinic',
                    'items.inventoryItem',
                ]),
                201
            );
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed to create prescription: ' . $e->getMessage()], 500);
        }
    }

    public function show(Request $request, int $id)
    {
        $doctor = $request->user();

        $prescription = Prescription::query()
            ->where('doctor_id', $doctor->id)
            ->with([
                'patient:id,first_name,last_name,email',
                'patient.patientProfile:user_id,phone,guardian_phone',
                'doctor',
                'items.inventoryItem',
            ])
            ->findOrFail($id);

        return response()->json($prescription);
    }

    public function index(Request $request)
    {
        $doctor = $request->user();

        $query = Prescription::query()
            ->where('doctor_id', $doctor->id)
            ->with([
                'patient:id,first_name,last_name,email',
                'patient.patientProfile:user_id,phone,guardian_phone',
            ]);

        if ($request->has('patient_id')) {
            $query->where('patient_id', $request->patient_id);
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        $prescriptions = $query
            ->orderBy('prescription_date', 'desc')
            ->get();

        return response()->json(['data' => $prescriptions]);
    }

    public function update(Request $request, int $id)
    {
        $doctor = $request->user();

        $prescription = Prescription::query()
            ->where('doctor_id', $doctor->id)
            ->where('status', 'pending') // Only allow updating pending prescriptions
            ->findOrFail($id);

        $validated = $request->validate([
            'prescription_date' => ['required', 'date'],
            'notes' => ['nullable', 'string', 'max:2000'],
            'instructions' => ['nullable', 'string', 'max:2000'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.inventory_item_id' => ['required', 'integer', 'exists:inventory_items,id'],
            'items.*.quantity' => ['nullable', 'integer', 'min:1'],
            'items.*.dosage' => ['nullable', 'string', 'max:100'],
            'items.*.frequency' => ['nullable', 'string', 'max:100'],
            'items.*.meal_timing' => ['nullable', 'string', 'max:100'],
            'items.*.duration_days' => ['nullable', 'integer', 'min:1'],
            'items.*.instructions' => ['nullable', 'string', 'max:500'],
        ]);

        DB::beginTransaction();
        try {
            // Update prescription
            $prescription->update([
                'prescription_date' => $validated['prescription_date'],
                'notes' => $validated['notes'] ?? null,
                'instructions' => $validated['instructions'] ?? null,
            ]);

            // Delete existing items and recreate them
            $prescription->items()->delete();

            // Create new prescription items
            foreach ($validated['items'] as $item) {
                $inventoryItem = InventoryItem::findOrFail($item['inventory_item_id']);
                
                $calculatedQuantity = MedicationQuantityCalculator::calculate(
                    $item['dosage'] ?? null,
                    $item['frequency'] ?? null,
                    $item['duration_days'] ?? null,
                    $item['quantity'] ?? null
                );
                $resolvedQuantity = (int) max(1, $calculatedQuantity ?? ($item['quantity'] ?? 1));

                PrescriptionItem::create([
                    'prescription_id' => $prescription->id,
                    'inventory_item_id' => $item['inventory_item_id'],
                    'quantity' => $resolvedQuantity,
                    'dosage' => $item['dosage'] ?? null,
                    'frequency' => $item['frequency'] ?? null,
                    'meal_timing' => $item['meal_timing'] ?? null,
                    'duration_days' => $item['duration_days'] ?? null,
                    'instructions' => $item['instructions'] ?? null,
                    'unit_price' => $inventoryItem->unit_price ?? 0,
                    'total_price' => ($inventoryItem->unit_price ?? 0) * $resolvedQuantity,
                ]);
            }

            DB::commit();

            return response()->json(
                $prescription->fresh()->load([
                    'patient:id,first_name,last_name,email',
                    'patient.patientProfile:user_id,phone,guardian_phone',
                    'doctor',
                    'clinic',
                    'items.inventoryItem',
                ])
            );
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed to update prescription: ' . $e->getMessage()], 500);
        }
    }

    public function destroy(Request $request, int $id)
    {
        $doctor = $request->user();

        $prescription = Prescription::query()
            ->where('doctor_id', $doctor->id)
            ->where('status', 'pending') // Only allow deleting pending prescriptions
            ->findOrFail($id);

        try {
            $prescription->delete();
            return response()->json(['message' => 'Prescription deleted successfully']);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to delete prescription: ' . $e->getMessage()], 500);
        }
    }
}

