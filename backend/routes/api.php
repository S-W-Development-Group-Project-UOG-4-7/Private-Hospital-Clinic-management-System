<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;

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
