<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\PrescriptionController;
use App\Http\Controllers\Api\InventoryController;
use App\Http\Controllers\Api\SupplierController;
use App\Http\Controllers\Api\DrugPurchaseController;

Route::prefix('auth')->group(function () {
    Route::post('register', [AuthController::class, 'register']);
    Route::post('login', [AuthController::class, 'login']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('logout', [AuthController::class, 'logout']);
        Route::get('me', [AuthController::class, 'me']);
    });
});

// Pharmacy & Inventory Management Routes (Pharmacist only)
Route::middleware(['auth:sanctum', 'role:pharmacist'])->group(function () {
    // Prescriptions
    Route::apiResource('prescriptions', PrescriptionController::class);
    Route::post('prescriptions/{id}/process', [PrescriptionController::class, 'process']);
    
    // Inventory
    Route::apiResource('inventory', InventoryController::class);
    Route::get('inventory/low-stock/list', [InventoryController::class, 'lowStock']);
    Route::get('inventory/expiring-soon/list', [InventoryController::class, 'expiringSoon']);
    Route::get('inventory/stats/overview', [InventoryController::class, 'stats']);
    
    // Suppliers
    Route::apiResource('suppliers', SupplierController::class);
    
    // Drug Purchases
    Route::apiResource('drug-purchases', DrugPurchaseController::class);
    Route::post('drug-purchases/{id}/receive', [DrugPurchaseController::class, 'receive']);
});
