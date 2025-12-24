<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Prescription;
use App\Models\PrescriptionItem;
use App\Models\InventoryItem;
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
            'items.*.quantity' => 'required|integer|min:1',
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
                $unitPrice = $inventoryItem->selling_price;

                PrescriptionItem::create([
                    'prescription_id' => $prescription->id,
                    'inventory_item_id' => $item['inventory_item_id'],
                    'quantity' => $item['quantity'],
                    'dosage' => $item['dosage'] ?? null,
                    'frequency' => $item['frequency'] ?? null,
                    'duration_days' => $item['duration_days'] ?? null,
                    'instructions' => $item['instructions'] ?? null,
                    'unit_price' => $unitPrice,
                    'total_price' => $unitPrice * $item['quantity'],
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
            foreach ($prescription->items as $item) {
                $inventoryItem = $item->inventoryItem;

                if ($inventoryItem->quantity < $item->quantity) {
                    DB::rollBack();
                    return response()->json([
                        'error' => "Insufficient stock for {$inventoryItem->name}. Available: {$inventoryItem->quantity}, Required: {$item->quantity}"
                    ], 400);
                }

                $inventoryItem->decrement('quantity', $item->quantity);
                $item->update(['is_dispensed' => true]);
            }

            $prescription->update([
                'status' => 'dispensed',
                'pharmacist_id' => $request->user()->id,
                'dispensed_at' => now(),
            ]);

            DB::commit();

            return response()->json($prescription->load(['patient', 'doctor', 'pharmacist', 'items.inventoryItem']));
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
}

