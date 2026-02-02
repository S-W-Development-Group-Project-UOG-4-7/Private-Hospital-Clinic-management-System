<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Drug;

class PharmacistController extends Controller
{
    // 1. View Inventory (Pharmacist View)
    public function index()
    {
        $drugs = Drug::select('id', 'name', 'stock_quantity', 'expiry_date')
            ->orderBy('expiry_date', 'asc') // Show expiring soon first
            ->get();

        return response()->json($drugs);
    }

    // 2. Issue/Dispense Medicine (Reduces Stock)
    public function dispense(Request $request, $id)
    {
        $request->validate([
            'quantity' => 'required|integer|min:1',
        ]);

        $drug = Drug::findOrFail($id);

        // Check if there is enough stock
        if ($drug->stock_quantity < $request->quantity) {
            return response()->json([
                'message' => 'Error: Insufficient stock. Only ' . $drug->stock_quantity . ' available.'
            ], 400);
        }

        // Reduce the stock
        $drug->decrement('stock_quantity', $request->quantity);

        return response()->json([
            'message' => 'Medicine issued successfully.',
            'drug' => $drug
        ]);
    }
}