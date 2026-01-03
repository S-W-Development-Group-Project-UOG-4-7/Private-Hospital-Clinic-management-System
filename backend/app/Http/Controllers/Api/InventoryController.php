<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\InventoryItem;
use Illuminate\Http\Request;

class InventoryController extends Controller
{
    public function index(Request $request)
    {
        $query = InventoryItem::with('supplier');

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('generic_name', 'like', "%{$search}%")
                  ->orWhere('brand_name', 'like', "%{$search}%");
            });
        }

        if ($request->has('category')) {
            $query->where('category', $request->category);
        }

        if ($request->has('low_stock')) {
            $query->whereRaw('quantity <= reorder_level');
        }

        if ($request->has('expiring_soon')) {
            $query->where('expiry_date', '<=', now()->addDays(30))
                  ->where('expiry_date', '>=', now());
        }

        $items = $query->orderBy('name')->paginate(50);

        return response()->json($items);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'generic_name' => 'nullable|string|max:255',
            'brand_name' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'category' => 'nullable|string|max:255',
            'unit' => 'required|string|max:255',
            'quantity' => 'required|integer|min:0',
            'reorder_level' => 'required|integer|min:0',
            'unit_price' => 'required|numeric|min:0',
            'selling_price' => 'required|numeric|min:0',
            'expiry_date' => 'nullable|date',
            'batch_number' => 'nullable|string|max:255',
            'supplier_id' => 'nullable|exists:suppliers,id',
            'is_active' => 'boolean',
        ]);

        $item = InventoryItem::create($validated);

        return response()->json($item->load('supplier'), 201);
    }

    public function show($id)
    {
        $item = InventoryItem::with('supplier')->findOrFail($id);
        return response()->json($item);
    }

    public function update(Request $request, $id)
    {
        $item = InventoryItem::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'generic_name' => 'nullable|string|max:255',
            'brand_name' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'category' => 'nullable|string|max:255',
            'unit' => 'sometimes|string|max:255',
            'quantity' => 'sometimes|integer|min:0',
            'reorder_level' => 'sometimes|integer|min:0',
            'unit_price' => 'sometimes|numeric|min:0',
            'selling_price' => 'sometimes|numeric|min:0',
            'expiry_date' => 'nullable|date',
            'batch_number' => 'nullable|string|max:255',
            'supplier_id' => 'nullable|exists:suppliers,id',
            'is_active' => 'boolean',
        ]);

        $item->update($validated);

        return response()->json($item->load('supplier'));
    }

    public function destroy($id)
    {
        $item = InventoryItem::findOrFail($id);
        $item->delete();

        return response()->json(['message' => 'Inventory item deleted successfully']);
    }

    public function lowStock()
    {
        $items = InventoryItem::whereRaw('quantity <= reorder_level')
            ->where('is_active', true)
            ->with('supplier')
            ->orderBy('quantity', 'asc')
            ->get();

        return response()->json($items);
    }

    public function expiringSoon()
    {
        $items = InventoryItem::where('expiry_date', '<=', now()->addDays(30))
            ->where('expiry_date', '>=', now())
            ->where('is_active', true)
            ->with('supplier')
            ->orderBy('expiry_date', 'asc')
            ->get();

        return response()->json($items);
    }

    public function stats()
    {
        $totalItems = InventoryItem::where('is_active', true)->count();
        $lowStockCount = InventoryItem::whereRaw('quantity <= reorder_level')
            ->where('is_active', true)
            ->count();
        $expiringSoonCount = InventoryItem::where('expiry_date', '<=', now()->addDays(30))
            ->where('expiry_date', '>=', now())
            ->where('is_active', true)
            ->count();
        $totalValue = InventoryItem::where('is_active', true)
            ->selectRaw('SUM(quantity * unit_price) as total')
            ->value('total') ?? 0;

        return response()->json([
            'total_items' => $totalItems,
            'low_stock_count' => $lowStockCount,
            'expiring_soon_count' => $expiringSoonCount,
            'total_value' => (float) $totalValue,
        ]);
    }

    // Pharmacist-specific methods
    public function createPurchaseRequest(Request $request)
    {
        $validated = $request->validate([
            'drug_name' => 'required|string|max:255',
            'quantity' => 'required|integer|min:1',
            'supplier_name' => 'required|string|max:255',
            'urgency' => 'nullable|in:low,medium,high',
            'notes' => 'nullable|string',
        ]);

        // In a real system, you'd have a PurchaseRequest model
        // For now, we'll just return a success response
        $requestData = array_merge($validated, [
            'id' => uniqid('PR-'),
            'requested_by' => $request->user()->name,
            'requested_at' => now(),
            'status' => 'pending',
        ]);

        return response()->json($requestData, 201);
    }

    public function controlledDrugs()
    {
        // Get controlled substances (simplified - in real system, you'd have a controlled_substances table)
        $controlledItems = InventoryItem::where('category', 'like', '%controlled%')
            ->orWhere('name', 'like', '%schedule%')
            ->with('supplier')
            ->get();

        return response()->json($controlledItems);
    }

    public function logControlledDrug(Request $request)
    {
        $validated = $request->validate([
            'drug_name' => 'required|string|max:255',
            'quantity' => 'required|numeric|min:0',
            'action' => 'required|in:dispensed,received,returned',
            'prescription_id' => 'nullable|exists:prescriptions,id',
            'notes' => 'nullable|string',
        ]);

        // In a real system, you'd save to a controlled_substances_logs table
        $logData = array_merge($validated, [
            'id' => uniqid('CSL-'),
            'pharmacist_id' => $request->user()->id,
            'pharmacist_name' => $request->user()->name,
            'timestamp' => now(),
        ]);

        return response()->json($logData, 201);
    }

    public function processReturn(Request $request)
    {
        $validated = $request->validate([
            'prescription_id' => 'required|exists:prescriptions,id',
            'drug_name' => 'required|string|max:255',
            'quantity' => 'required|integer|min:1',
            'reason' => 'required|string',
            'notes' => 'nullable|string',
        ]);

        // In a real system, you'd have a Returns model and update inventory
        $returnData = array_merge($validated, [
            'id' => uniqid('RET-'),
            'processed_by' => $request->user()->name,
            'processed_at' => now(),
            'status' => 'processed',
        ]);

        // Update inventory (simplified)
        $inventoryItem = InventoryItem::where('name', $validated['drug_name'])->first();
        if ($inventoryItem) {
            $inventoryItem->increment('quantity', $validated['quantity']);
        }

        return response()->json($returnData, 201);
    }

    public function getReturns(Request $request)
    {
        // In a real system, you'd have a Returns model
        // For now, return mock data
        $returns = [
            [
                'id' => 'RET-001',
                'prescription_id' => 1,
                'drug_name' => 'Aspirin',
                'quantity' => 10,
                'reason' => 'Patient allergy',
                'status' => 'processed',
                'returned_by' => 'John Doe',
                'returned_at' => now()->subDays(1),
            ],
        ];

        return response()->json($returns);
    }

    public function inventoryReport()
    {
        $report = [
            'total_items' => InventoryItem::where('is_active', true)->count(),
            'low_stock_items' => InventoryItem::whereRaw('quantity <= reorder_level')
                ->where('is_active', true)->count(),
            'expiring_soon' => InventoryItem::where('expiry_date', '<=', now()->addDays(30))
                ->where('expiry_date', '>=', now())
                ->where('is_active', true)->count(),
            'total_value' => InventoryItem::where('is_active', true)
                ->selectRaw('SUM(quantity * unit_price) as total')
                ->value('total') ?? 0,
            'generated_at' => now(),
        ];

        return response()->json($report);
    }

    public function storageReport()
    {
        $report = [
            'storage_conditions' => [
                'refrigerated' => InventoryItem::where('category', 'like', '%refrigerated%')->count(),
                'room_temperature' => InventoryItem::where('category', 'like', '%room%')->count(),
                'controlled' => InventoryItem::where('category', 'like', '%controlled%')->count(),
            ],
            'expiry_summary' => [
                'expired' => InventoryItem::where('expiry_date', '<', now())->count(),
                'expiring_this_month' => InventoryItem::where('expiry_date', '<=', now()->addDays(30))
                    ->where('expiry_date', '>=', now())->count(),
                'expiring_next_month' => InventoryItem::where('expiry_date', '<=', now()->addDays(60))
                    ->where('expiry_date', '>', now()->addDays(30))->count(),
            ],
            'generated_at' => now(),
        ];

        return response()->json($report);
    }

    public function auditLogs(Request $request)
    {
        // In a real system, you'd have an audit_logs table
        // For now, return mock data
        $logs = [
            [
                'id' => 1,
                'action' => 'inventory_update',
                'entity_type' => 'inventory_item',
                'entity_id' => 1,
                'user_id' => $request->user()->id,
                'user_name' => $request->user()->name,
                'changes' => ['quantity' => ['old' => 50, 'new' => 45]],
                'timestamp' => now()->subHours(2),
            ],
            [
                'id' => 2,
                'action' => 'prescription_dispensed',
                'entity_type' => 'prescription',
                'entity_id' => 1,
                'user_id' => $request->user()->id,
                'user_name' => $request->user()->name,
                'changes' => ['status' => ['old' => 'pending', 'new' => 'dispensed']],
                'timestamp' => now()->subHours(1),
            ],
        ];

        return response()->json($logs);
    }
}

