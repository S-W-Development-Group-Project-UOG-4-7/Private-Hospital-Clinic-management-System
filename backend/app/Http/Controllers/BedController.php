<?php

namespace App\Http\Controllers; // Add \Admin here

use App\Http\Controllers\Controller; // Add this line to allow it to find the base Controller
use Illuminate\Http\Request;
use App\Models\Ward;
use App\Models\Bed;

class BedController extends Controller
{
    // 1. Get all Wards with their Beds
    public function index()
    {
        // Check if we have any wards. If not, create some defaults.
        if (Ward::count() === 0) {
            $this->seedDefaults();
        }

        $wards = Ward::with(['beds' => function($query) {
            $query->orderBy('bed_number', 'asc');
        }])->get();

        return response()->json([
            'success' => true,
            'data' => $wards
        ]);
    }

    // 2. Toggle a Bed's Availability
    public function toggleStatus($id)
    {
        $bed = Bed::find($id);
        
        if (!$bed) {
            return response()->json(['success' => false, 'message' => 'Bed not found'], 404);
        }

        $bed->is_available = !$bed->is_available; // Switch true/false
        $bed->save();

        return response()->json([
            'success' => true, 
            'message' => 'Bed status updated',
            'data' => $bed
        ]);
    }

    // Helper: Create default hospital setup if empty
    private function seedDefaults()
    {
        // Create ICU Ward
        $icu = Ward::create(['name' => 'Intensive Care Unit', 'type' => 'ICU', 'capacity' => 5]);
        for ($i = 1; $i <= 5; $i++) {
            Bed::create(['ward_id' => $icu->id, 'bed_number' => "ICU-0$i", 'is_available' => true]);
        }

        // Create General Ward
        $gen = Ward::create(['name' => 'General Ward A', 'type' => 'General', 'capacity' => 10]);
        for ($i = 1; $i <= 10; $i++) {
            Bed::create(['ward_id' => $gen->id, 'bed_number' => "GEN-0$i", 'is_available' => true]);
        }
    }
}