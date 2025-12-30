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
}

