<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DrugPurchase;
use App\Models\DrugPurchaseItem;
use App\Models\InventoryItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class DrugPurchaseController extends Controller
{
    public function index(Request $request)
    {
        $query = DrugPurchase::with(['supplier', 'purchaser', 'items.inventoryItem']);

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('supplier_id')) {
            $query->where('supplier_id', $request->supplier_id);
        }

        $purchases = $query->orderBy('created_at', 'desc')->paginate(20);

        return response()->json($purchases);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'supplier_id' => 'required|exists:suppliers,id',
            'purchase_date' => 'required|date',
            'expected_delivery_date' => 'nullable|date',
            'tax' => 'nullable|numeric|min:0',
            'discount' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.inventory_item_id' => 'required|exists:inventory_items,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.expiry_date' => 'nullable|date',
            'items.*.batch_number' => 'nullable|string|max:255',
            'items.*.notes' => 'nullable|string',
        ]);

        DB::beginTransaction();
        try {
            $subtotal = 0;
            foreach ($validated['items'] as $item) {
                $subtotal += $item['quantity'] * $item['unit_price'];
            }

            $tax = $validated['tax'] ?? 0;
            $discount = $validated['discount'] ?? 0;
            $totalAmount = $subtotal + $tax - $discount;

            $purchase = DrugPurchase::create([
                'purchase_number' => 'PO-' . strtoupper(Str::random(8)),
                'supplier_id' => $validated['supplier_id'],
                'purchased_by' => $request->user()->id,
                'purchase_date' => $validated['purchase_date'],
                'expected_delivery_date' => $validated['expected_delivery_date'] ?? null,
                'status' => 'pending',
                'subtotal' => $subtotal,
                'tax' => $tax,
                'discount' => $discount,
                'total_amount' => $totalAmount,
                'notes' => $validated['notes'] ?? null,
            ]);

            foreach ($validated['items'] as $item) {
                DrugPurchaseItem::create([
                    'drug_purchase_id' => $purchase->id,
                    'inventory_item_id' => $item['inventory_item_id'],
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['unit_price'],
                    'total_price' => $item['quantity'] * $item['unit_price'],
                    'expiry_date' => $item['expiry_date'] ?? null,
                    'batch_number' => $item['batch_number'] ?? null,
                    'notes' => $item['notes'] ?? null,
                ]);
            }

            DB::commit();

            return response()->json($purchase->load(['supplier', 'purchaser', 'items.inventoryItem']), 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function show($id)
    {
        $purchase = DrugPurchase::with(['supplier', 'purchaser', 'items.inventoryItem'])->findOrFail($id);
        return response()->json($purchase);
    }

    public function update(Request $request, $id)
    {
        $purchase = DrugPurchase::findOrFail($id);

        $validated = $request->validate([
            'status' => 'sometimes|in:pending,ordered,received,cancelled',
            'expected_delivery_date' => 'nullable|date',
            'notes' => 'nullable|string',
        ]);

        $purchase->update($validated);

        return response()->json($purchase->load(['supplier', 'purchaser', 'items.inventoryItem']));
    }

    public function receive(Request $request, $id)
    {
        $purchase = DrugPurchase::with('items.inventoryItem')->findOrFail($id);

        if ($purchase->status === 'received') {
            return response()->json(['error' => 'Purchase already received'], 400);
        }

        DB::beginTransaction();
        try {
            foreach ($purchase->items as $item) {
                $inventoryItem = $item->inventoryItem;
                
                // Update inventory
                $inventoryItem->increment('quantity', $item->quantity);
                
                // Update expiry date and batch number if provided
                if ($item->expiry_date) {
                    $inventoryItem->update(['expiry_date' => $item->expiry_date]);
                }
                if ($item->batch_number) {
                    $inventoryItem->update(['batch_number' => $item->batch_number]);
                }
            }

            $purchase->update([
                'status' => 'received',
                'received_at' => now(),
            ]);

            DB::commit();

            return response()->json($purchase->load(['supplier', 'purchaser', 'items.inventoryItem']));
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function destroy($id)
    {
        $purchase = DrugPurchase::findOrFail($id);
        $purchase->delete();

        return response()->json(['message' => 'Drug purchase deleted successfully']);
    }
}

