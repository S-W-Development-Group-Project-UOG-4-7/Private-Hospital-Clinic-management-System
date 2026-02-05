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
use Illuminate\Support\Facades\Log;

class DoctorPrescriptionController extends Controller
{
    public function store(Request $request)
    {
        $doctor = $request->user();
        
        $validated = $request->validate([
            'patient_id' => ['required', 'integer', 'exists:users,id'],
            'appointment_id' => ['nullable', 'integer', 'exists:appointments,id'],
            'clinic_id' => ['nullable', 'integer', 'exists:clinics,id'],
            'prescription_date' => ['required', 'date'],
            'notes' => ['nullable', 'string', 'max:2000'],
            'instructions' => ['nullable', 'string', 'max:2000'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.inventory_item_id' => ['nullable', 'integer'],
            'items.*.medicine_name' => ['nullable', 'string', 'max:255'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
            'items.*.dosage' => ['nullable', 'string', 'max:100'],
            'items.*.frequency' => ['nullable', 'string', 'max:100'],
            'items.*.meal_timing' => ['nullable', 'string', 'max:100'],
            'items.*.duration_days' => ['nullable', 'integer', 'min:1'],
            'items.*.instructions' => ['nullable', 'string', 'max:500'],
        ]);

        // Log incoming request for debugging
        Log::info('Prescription creation request', [
            'user_id' => $doctor->id,
            'request_data' => $request->all(),
            'validated_data' => $validated
        ]);

        // Custom validation for inventory items - only check exists for positive IDs
        foreach ($validated['items'] as $index => $item) {
            $rawInventoryId = $item['inventory_item_id'] ?? null;
            if ($rawInventoryId !== null && $rawInventoryId > 0) {
                // Positive IDs must exist in inventory_items table
                $inventoryExists = \App\Models\InventoryItem::where('id', $rawInventoryId)->exists();
                if (!$inventoryExists) {
                    return response()->json([
                        'message' => 'The selected inventory item does not exist.',
                        'errors' => ["items.{$index}.inventory_item_id" => ['The selected inventory item does not exist.']]
                    ], 422);
                }
            }
            // Require medicine name when no inventory item is selected
            if (($rawInventoryId === null || $rawInventoryId <= 0) && empty($item['medicine_name'])) {
                return response()->json([
                    'message' => 'Each item must have either an inventory item or a medicine name.',
                    'errors' => ["items.{$index}.medicine_name" => ['Medicine name is required when no inventory item is selected.']]
                ], 422);
            }
            // Negative IDs are allowed (default medicines)
        }

        // Custom validation logic can be removed if not needed
        // foreach ($validated['items'] as $index => $item) {
        //     if (empty($item['inventory_item_id']) && empty($item['medicine_name'])) {
        //         return response()->json([
        //             'message' => 'Each item must have either an inventory_item_id or a medicine_name.',
        //             'errors' => ["items.{$index}" => ['Either inventory_item_id or medicine_name is required.']]
        //         ], 422);
        //     }
        // }

        if (! empty($validated['appointment_id'])) {
            $appointment = \App\Models\Appointment::query()
                ->where('id', (int) $validated['appointment_id'])
                ->where('doctor_id', $doctor->id)
                ->where('patient_id', (int) $validated['patient_id'])
                ->first();

            if (! $appointment) {
                return response()->json(['message' => 'Appointment not found for this doctor/patient.'], 403);
            }
        }

        DB::beginTransaction();
        try {
            // Generate prescription number
            $prescriptionNumber = 'RX-' . strtoupper(Str::random(8));

            $prescription = Prescription::create([
                'prescription_number' => $prescriptionNumber,
                'patient_id' => $validated['patient_id'],
                'doctor_id' => $doctor->id,
                'clinic_id' => $validated['clinic_id'] ?? null,
                'appointment_id' => $validated['appointment_id'] ?? null,
                'prescription_date' => $validated['prescription_date'],
                'status' => 'pending',
                'notes' => $validated['notes'] ?? null,
                'instructions' => $validated['instructions'] ?? null,
            ]);

            // Create prescription items
            foreach ($validated['items'] as $item) {
                $unitPrice = 0;
                $medicineName = $item['medicine_name'] ?? null;
                $inventoryItemId = null;
                $inventoryItem = null;
                $rawInventoryId = $item['inventory_item_id'] ?? null;
                
                // If inventory_item_id is positive, get price and name from inventory
                if ($rawInventoryId !== null && $rawInventoryId > 0) {
                    $inventoryItem = InventoryItem::find($rawInventoryId);
                    if ($inventoryItem) {
                        $unitPrice = $inventoryItem->unit_price ?? 0;
                        $inventoryItemId = $rawInventoryId;
                        // Use inventory item name if medicine_name not provided
                        if (empty($medicineName)) {
                            $medicineName = $inventoryItem->name;
                        }
                    }
                } elseif ($rawInventoryId !== null && $rawInventoryId < 0) {
                    // Negative ID indicates a default medicine - use provided medicine name
                    $inventoryItemId = null; // Don't store negative IDs in database
                    // Medicine name should be provided by frontend for default medicines
                }
                
                $calculatedQuantity = MedicationQuantityCalculator::calculate(
                    $item['dosage'] ?? null,
                    $item['frequency'] ?? null,
                    $item['duration_days'] ?? null,
                    $item['quantity'] ?? null
                );
                $resolvedQuantity = (int) max(1, $calculatedQuantity ?? ($item['quantity'] ?? 1));

                Log::debug('Creating prescription item', [
                    'inventory_item_id' => $inventoryItemId,
                    'medicine_name_from_request' => $item['medicine_name'] ?? null,
                    'final_medicine_name' => $medicineName,
                    'quantity' => $resolvedQuantity
                ]);

                PrescriptionItem::create([
                    'prescription_id' => $prescription->id,
                    'inventory_item_id' => $inventoryItemId,
                    'medicine_name' => $medicineName,
                    'quantity' => $resolvedQuantity,
                    'dosage' => $item['dosage'] ?? null,
                    'frequency' => $item['frequency'] ?? null,
                    'duration_days' => $item['duration_days'] ?? null,
                    'instructions' => $item['instructions'] ?? null,
                    'meal_timing' => $item['meal_timing'] ?? null,
                    'unit_price' => $unitPrice,
                    'total_price' => $unitPrice * $resolvedQuantity,
                ]);

                if ($inventoryItem) {
                    $inventoryItem->decrement('quantity', $resolvedQuantity);
                }
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
            'items.*.inventory_item_id' => ['nullable', 'integer'],
            'items.*.medicine_name' => ['nullable', 'string', 'max:255'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
            'items.*.dosage' => ['nullable', 'string', 'max:100'],
            'items.*.frequency' => ['nullable', 'string', 'max:100'],
            'items.*.meal_timing' => ['nullable', 'string', 'max:100'],
            'items.*.duration_days' => ['nullable', 'integer', 'min:1'],
            'items.*.instructions' => ['nullable', 'string', 'max:500'],
        ]);

        foreach ($validated['items'] as $index => $item) {
            $rawInventoryId = $item['inventory_item_id'] ?? null;
            if ($rawInventoryId !== null && $rawInventoryId > 0) {
                $inventoryExists = \App\Models\InventoryItem::where('id', $rawInventoryId)->exists();
                if (!$inventoryExists) {
                    return response()->json([
                        'message' => 'The selected inventory item does not exist.',
                        'errors' => ["items.{$index}.inventory_item_id" => ['The selected inventory item does not exist.']]
                    ], 422);
                }
            }
            if (($rawInventoryId === null || $rawInventoryId <= 0) && empty($item['medicine_name'])) {
                return response()->json([
                    'message' => 'Each item must have either an inventory item or a medicine name.',
                    'errors' => ["items.{$index}.medicine_name" => ['Medicine name is required when no inventory item is selected.']]
                ], 422);
            }
        }

        DB::beginTransaction();
        try {
            $rootId = $prescription->root_prescription_id ?? $prescription->id;
            $nextVersion = (int) ($prescription->version ?? 1) + 1;

            $newPrescription = Prescription::create([
                'prescription_number' => 'RX-' . strtoupper(Str::random(8)),
                'patient_id' => $prescription->patient_id,
                'doctor_id' => $doctor->id,
                'clinic_id' => $prescription->clinic_id,
                'appointment_id' => $prescription->appointment_id,
                'prescription_date' => $validated['prescription_date'],
                'status' => 'pending',
                'notes' => $validated['notes'] ?? null,
                'instructions' => $validated['instructions'] ?? null,
                'root_prescription_id' => $rootId,
                'previous_prescription_id' => $prescription->id,
                'version' => $nextVersion,
            ]);

            // Create new prescription items
            foreach ($validated['items'] as $item) {
                $unitPrice = 0;
                $medicineName = $item['medicine_name'] ?? null;
                $inventoryItemId = null;
                $inventoryItem = null;
                $rawInventoryId = $item['inventory_item_id'] ?? null;

                if ($rawInventoryId !== null && $rawInventoryId > 0) {
                    $inventoryItem = InventoryItem::find($rawInventoryId);
                    if ($inventoryItem) {
                        $unitPrice = $inventoryItem->unit_price ?? 0;
                        $inventoryItemId = $rawInventoryId;
                        if (empty($medicineName)) {
                            $medicineName = $inventoryItem->name;
                        }
                    }
                }
                
                $calculatedQuantity = MedicationQuantityCalculator::calculate(
                    $item['dosage'] ?? null,
                    $item['frequency'] ?? null,
                    $item['duration_days'] ?? null,
                    $item['quantity'] ?? null
                );
                $resolvedQuantity = (int) max(1, $calculatedQuantity ?? ($item['quantity'] ?? 1));

                PrescriptionItem::create([
                    'prescription_id' => $newPrescription->id,
                    'inventory_item_id' => $inventoryItemId,
                    'medicine_name' => $medicineName,
                    'quantity' => $resolvedQuantity,
                    'dosage' => $item['dosage'] ?? null,
                    'frequency' => $item['frequency'] ?? null,
                    'meal_timing' => $item['meal_timing'] ?? null,
                    'duration_days' => $item['duration_days'] ?? null,
                    'instructions' => $item['instructions'] ?? null,
                    'unit_price' => $unitPrice,
                    'total_price' => $unitPrice * $resolvedQuantity,
                ]);

                if ($inventoryItem) {
                    $inventoryItem->decrement('quantity', $resolvedQuantity);
                }
            }

            DB::commit();

            return response()->json(
                $newPrescription->fresh()->load([
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
