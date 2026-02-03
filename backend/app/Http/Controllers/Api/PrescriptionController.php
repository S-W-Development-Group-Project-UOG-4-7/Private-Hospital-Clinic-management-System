<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Prescription;
use App\Models\PrescriptionItem;
use App\Models\InventoryItem;
use App\Models\Invoice;
use App\Services\MedicationQuantityCalculator;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class PrescriptionController extends Controller
{
    public function index(Request $request)
    {
        $query = Prescription::with(['patient', 'doctor', 'pharmacist', 'items.inventoryItem']);

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('patient_id')) {
            $query->where('patient_id', $request->patient_id);
        }

        $prescriptions = $query->orderBy('created_at', 'desc')->paginate(20);

        return response()->json($prescriptions);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'patient_id' => 'required|exists:users,id',
            'doctor_id' => 'nullable|exists:users,id',
            'prescription_date' => 'required|date',
            'notes' => 'nullable|string',
            'instructions' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.inventory_item_id' => 'required|exists:inventory_items,id',
            'items.*.quantity' => 'nullable|integer|min:1',
            'items.*.dosage' => 'nullable|string',
            'items.*.frequency' => 'nullable|string',
            'items.*.duration_days' => 'nullable|integer',
            'items.*.instructions' => 'nullable|string',
        ]);

        DB::beginTransaction();
        try {
            $prescription = Prescription::create([
                'prescription_number' => 'RX-' . strtoupper(Str::random(8)),
                'patient_id' => $validated['patient_id'],
                'doctor_id' => $validated['doctor_id'] ?? null,
                'prescription_date' => $validated['prescription_date'],
                'status' => 'pending',
                'notes' => $validated['notes'] ?? null,
                'instructions' => $validated['instructions'] ?? null,
            ]);

            foreach ($validated['items'] as $item) {
                $inventoryItem = InventoryItem::findOrFail($item['inventory_item_id']);
                $unitPrice = $inventoryItem->selling_price ?? $inventoryItem->unit_price ?? 0;

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
                    'duration_days' => $item['duration_days'] ?? null,
                    'instructions' => $item['instructions'] ?? null,
                    'unit_price' => $unitPrice,
                    'total_price' => $unitPrice * $resolvedQuantity,
                ]);
            }

            DB::commit();

            return response()->json($prescription->load(['patient', 'doctor', 'items.inventoryItem']), 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function show($id)
    {
        $prescription = Prescription::with(['patient', 'doctor', 'pharmacist', 'items.inventoryItem'])->findOrFail($id);
        return response()->json($prescription);
    }

    public function update(Request $request, $id)
    {
        $prescription = Prescription::findOrFail($id);

        $validated = $request->validate([
            'status' => 'sometimes|in:pending,processing,dispensed,cancelled',
            'notes' => 'nullable|string',
            'instructions' => 'nullable|string',
        ]);

        $prescription->update($validated);

        return response()->json($prescription->load(['patient', 'doctor', 'pharmacist', 'items.inventoryItem']));
    }

    public function process(Request $request, $id)
    {
        $prescription = Prescription::with('items.inventoryItem')->findOrFail($id);

        if ($prescription->status === 'dispensed') {
            return response()->json(['error' => 'Prescription already dispensed'], 400);
        }

        DB::beginTransaction();
        try {
            $lowStockAlerts = [];

            foreach ($prescription->items as $item) {
                $inventoryItem = $item->inventoryItem;
                $dispenseQuantity = $this->resolveItemQuantity($item);
                $unitPrice = (float) ($item->unit_price ?: ($inventoryItem->selling_price ?? $inventoryItem->unit_price ?? 0));

                if ($inventoryItem->quantity < $dispenseQuantity) {
                    DB::rollBack();
                    return response()->json([
                        'error' => "Insufficient stock for {$inventoryItem->name}. Available: {$inventoryItem->quantity}, Required: {$dispenseQuantity}"
                    ], 400);
                }

                $inventoryItem->decrement('quantity', $dispenseQuantity);
                $inventoryItem->refresh();

                if ($inventoryItem->quantity <= $inventoryItem->reorder_level) {
                    $lowStockAlerts[] = $this->formatLowStockAlert($inventoryItem);
                }

                $item->update([
                    'is_dispensed' => true,
                    'quantity' => $dispenseQuantity,
                    'unit_price' => $unitPrice,
                    'total_price' => $unitPrice * $dispenseQuantity,
                ]);
            }

            $prescription->update([
                'status' => 'dispensed',
                'pharmacist_id' => $request->user()->id,
                'dispensed_at' => now(),
            ]);

            DB::commit();
            $prescription = $prescription->fresh()->load(['patient', 'doctor', 'pharmacist', 'items.inventoryItem']);

            if (!empty($lowStockAlerts)) {
                $prescription->setAttribute('low_stock_alerts', $lowStockAlerts);
            }

            return response()->json($prescription);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function destroy($id)
    {
        $prescription = Prescription::findOrFail($id);
        $prescription->delete();

        return response()->json(['message' => 'Prescription deleted successfully']);
    }

    // Pharmacist-specific methods
    public function checkInteractions($id)
    {
        $prescription = Prescription::with('items.inventoryItem')->findOrFail($id);

        // Simple interaction checking logic (in a real system, this would be more sophisticated)
        $interactions = [];
        $medications = $prescription->items->pluck('inventoryItem.name')->toArray();

        // Check for common interactions (simplified example)
        if (in_array('Aspirin', $medications) && in_array('Warfarin', $medications)) {
            $interactions[] = 'Aspirin and Warfarin may increase bleeding risk';
        }

        if (in_array('Amiodarone', $medications) && in_array('Digoxin', $medications)) {
            $interactions[] = 'Amiodarone may increase Digoxin levels';
        }

        return response()->json([
            'prescription_id' => $id,
            'interactions' => $interactions,
            'warnings' => count($interactions) > 0 ? 'Drug interactions detected' : 'No interactions detected'
        ]);
    }

    public function dispense(Request $request, $id)
    {
        $prescription = Prescription::with('items.inventoryItem')->findOrFail($id);

        if ($prescription->status === 'dispensed') {
            return response()->json(['error' => 'Prescription already dispensed'], 400);
        }

        $validated = $request->validate([
            'notes' => 'nullable|string',
        ]);

        DB::beginTransaction();
        try {
            $totalAmount = 0;
            $lowStockAlerts = [];

            foreach ($prescription->items as $item) {
                $inventoryItem = $item->inventoryItem;
                $dispenseQuantity = $this->resolveItemQuantity($item);

                if ($inventoryItem->quantity < $dispenseQuantity) {
                    DB::rollBack();
                    return response()->json([
                        'error' => "Insufficient stock for {$inventoryItem->name}. Available: {$inventoryItem->quantity}, Required: {$dispenseQuantity}"
                    ], 400);
                }

                $inventoryItem->decrement('quantity', $dispenseQuantity);
                $inventoryItem->refresh();

                if ($inventoryItem->quantity <= $inventoryItem->reorder_level) {
                    $lowStockAlerts[] = $this->formatLowStockAlert($inventoryItem);
                }

                $unitPrice = (float) ($item->unit_price ?: ($inventoryItem->selling_price ?? $inventoryItem->unit_price ?? 0));
                $totalPrice = $unitPrice * $dispenseQuantity;

                $item->update([
                    'is_dispensed' => true,
                    'quantity' => $dispenseQuantity,
                    'unit_price' => $unitPrice,
                    'total_price' => $totalPrice,
                ]);

                $totalAmount += $totalPrice;
            }

            $prescription->update([
                'status' => 'dispensed',
                'pharmacist_id' => $request->user()->id,
                'dispensed_at' => now(),
                'notes' => $validated['notes'] ?? $prescription->notes,
            ]);

            $invoice = null;
            if ($totalAmount > 0) {
                $invoice = Invoice::create([
                    'invoice_number' => 'INV-' . Str::upper(Str::random(10)),
                    'patient_id' => $prescription->patient_id,
                    'amount' => $totalAmount,
                    'status' => 'unpaid',
                    'issued_at' => now()->toDateString(),
                    'due_date' => now()->addDays(7)->toDateString(),
                    'description' => sprintf(
                        'Prescription %s dispensed by pharmacy',
                        $prescription->prescription_number ?? $prescription->id
                    ),
                ]);
            }

            $prescription = $prescription->fresh()->load(['patient', 'doctor', 'pharmacist', 'items.inventoryItem']);

            if ($invoice) {
                $prescription->setAttribute('invoice', $invoice);
            }

            if (!empty($lowStockAlerts)) {
                $prescription->setAttribute('low_stock_alerts', $lowStockAlerts);
            }

            DB::commit();

            return response()->json($prescription);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function generateLabel(Request $request, $id)
    {
        $prescription = Prescription::with(['patient', 'doctor', 'items.inventoryItem'])->findOrFail($id);

        $labelData = [
            'prescription_id' => $prescription->id,
            'prescription_number' => $prescription->prescription_number,
            'patient_name' => $prescription->patient->name,
            'patient_dob' => $prescription->patient->date_of_birth,
            'doctor_name' => $prescription->doctor->name,
            'date' => now()->format('Y-m-d'),
            'items' => $prescription->items->map(function ($item) {
                return [
                    'medication' => $item->inventoryItem->name,
                    'dosage' => $item->dosage,
                    'quantity' => $item->quantity,
                    'instructions' => $item->instructions,
                ];
            }),
        ];

        // In a real system, you might save this to a labels table
        return response()->json($labelData);
    }

    public function printLabel(Request $request, $id)
    {
        $prescription = Prescription::with(['patient', 'doctor', 'items.inventoryItem'])->findOrFail($id);

        // Generate label data
        $labelData = [
            'prescription_id' => $prescription->id,
            'prescription_number' => $prescription->prescription_number,
            'patient_name' => $prescription->patient->name,
            'patient_dob' => $prescription->patient->date_of_birth,
            'doctor_name' => $prescription->doctor->name,
            'date' => now()->format('Y-m-d'),
            'items' => $prescription->items->map(function ($item) {
                return [
                    'medication' => $item->inventoryItem->name,
                    'dosage' => $item->dosage,
                    'quantity' => $item->quantity,
                    'instructions' => $item->instructions,
                ];
            }),
        ];

        // In a real system, this would trigger actual printing
        return response()->json([
            'message' => 'Label printed successfully',
            'label_data' => $labelData
        ]);
    }

    protected function resolveItemQuantity(PrescriptionItem $item): int
    {
        return MedicationQuantityCalculator::fromPrescriptionItem($item);
    }

    protected function formatLowStockAlert(InventoryItem $inventoryItem): array
    {
        return [
            'inventory_item_id' => $inventoryItem->id,
            'name' => $inventoryItem->name,
            'quantity' => $inventoryItem->quantity,
            'reorder_level' => $inventoryItem->reorder_level,
        ];
    }
}

