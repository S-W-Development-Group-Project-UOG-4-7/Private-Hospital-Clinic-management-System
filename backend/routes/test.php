<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// Test prescription validation
Route::post('/test-prescription', function (Request $request) {
    try {
        $validated = $request->validate([
            'patient_id' => ['required', 'integer', 'exists:users,id'],
            'appointment_id' => ['nullable', 'integer', 'exists:appointments,id'],
            'prescription_date' => ['required', 'date'],
            'notes' => ['nullable', 'string', 'max:2000'],
            'instructions' => ['nullable', 'string', 'max:2000'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.inventory_item_id' => ['required', 'integer', 'exists:inventory_items,id'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
            'items.*.dosage' => ['nullable', 'string', 'max:100'],
            'items.*.frequency' => ['nullable', 'string', 'max:100'],
            'items.*.duration_days' => ['nullable', 'integer', 'min:1'],
            'items.*.instructions' => ['nullable', 'string', 'max:500'],
        ]);
        
        return response()->json([
            'success' => true,
            'message' => 'Validation passed',
            'data' => $validated
        ]);
    } catch (\Illuminate\Validation\ValidationException $e) {
        return response()->json([
            'success' => false,
            'message' => 'Validation failed',
            'errors' => $e->errors(),
            'request_data' => $request->all()
        ], 422);
    }
});
