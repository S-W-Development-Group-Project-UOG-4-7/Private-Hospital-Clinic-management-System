<?php

namespace App\Http\Controllers;

use App\Models\Bed;
use Illuminate\Http\Request;

class BedController extends Controller
{
    // 1. Get all beds (for the Dashboard Grid)
    public function index()
    {
        // Get all beds and attach the Ward info (e.g., "Bed 1 is in ICU")
        // Note: This requires you to have a 'ward' relationship in your Bed model.
        // If you haven't set that up yet, change 'with('ward')->get()' to just 'get()'
        $beds = Bed::with('ward')->get();
        
        return response()->json([
            'success' => true,
            'data' => $beds
        ]);
    }

    // 2. Toggle Bed Status (Occupied/Empty)
    public function toggleStatus($id)
    {
        $bed = Bed::find($id);
        
        if (!$bed) {
            return response()->json(['success' => false, 'message' => 'Bed not found'], 404);
        }

        // Flip the status (True becomes False, False becomes True)
        $bed->is_occupied = !$bed->is_occupied;
        $bed->save();

        return response()->json([
            'success' => true, 
            'message' => 'Bed status updated',
            'data' => $bed
        ]);
    }
}