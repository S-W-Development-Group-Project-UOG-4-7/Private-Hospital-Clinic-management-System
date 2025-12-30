<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// --- 1. Import your Controllers ---
use App\Http\Controllers\Api\AuthController;

// NEW: Import the BedController (Ensure the file is in App/Http/Controllers)
use App\Http\Controllers\BedController; 

Route::prefix('auth')->group(function () {
    Route::post('register', [AuthController::class, 'register']);
    Route::post('login', [AuthController::class, 'login']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('logout', [AuthController::class, 'logout']);
        Route::get('me', [AuthController::class, 'me']);
    });
});

Route::middleware(['auth:sanctum', 'role:admin'])->get('/admin/health', function () {
    return response()->json(['status' => 'ok', 'scope' => 'admin']);
});

Route::middleware(['auth:sanctum', 'role:doctor'])->get('/doctor/health', function () {
    return response()->json(['status' => 'ok', 'scope' => 'doctor']);
});

Route::middleware(['auth:sanctum', 'role:receptionist'])->get('/reception/health', function () {
    return response()->json(['status' => 'ok', 'scope' => 'receptionist']);
});

Route::middleware(['auth:sanctum', 'role:pharmacist'])->get('/pharmacy/health', function () {
    return response()->json(['status' => 'ok', 'scope' => 'pharmacist']);
});

Route::middleware(['auth:sanctum', 'role:patient'])->get('/patient/health', function () {
    return response()->json(['status' => 'ok', 'scope' => 'patient']);
});

// --- NEW: Bed Management Routes (Admin / Doctor) ---
// Note: For now, these are public so you can test easily. 
// Later, you should wrap them in middleware like ['auth:sanctum', 'role:admin']

Route::get('/beds', [BedController::class, 'index']);
Route::post('/beds/{id}/toggle', [BedController::class, 'toggleStatus']);