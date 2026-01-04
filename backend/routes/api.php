<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\PrescriptionController;
use App\Http\Controllers\Api\InventoryController;
use App\Http\Controllers\Api\SupplierController;
use App\Http\Controllers\Api\DrugPurchaseController;
use App\Http\Controllers\Api\PatientAppointmentController;
use App\Http\Controllers\Api\PatientBillingController;
use App\Http\Controllers\Api\PatientEhrController;
use App\Http\Controllers\Api\PatientFeedbackController;
use App\Http\Controllers\Api\PatientNotificationController;
use App\Http\Controllers\Api\PatientProfileController;
use App\Http\Controllers\Api\PatientPrescriptionController;
use App\Http\Controllers\Api\PatientTeleconsultationController;
use App\Http\Controllers\Api\ReceptionistAppointmentController;
use App\Http\Controllers\Api\ReceptionistDashboardController;
use App\Http\Controllers\Api\ReceptionistDoctorController;
use App\Http\Controllers\Api\ReceptionistDoctorScheduleController;
use App\Http\Controllers\Api\ReceptionistInvoiceController;
use App\Http\Controllers\Api\ReceptionistPatientController;
use App\Http\Controllers\Api\ReceptionistPaymentController;
use App\Http\Controllers\Api\ReceptionistQueueController;
use App\Http\Controllers\Api\ReceptionistReferralController;

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

// Patient Portal Routes (Patient only)
Route::middleware(['auth:sanctum', 'role:patient'])->prefix('patient')->group(function () {
    Route::get('profile', [PatientProfileController::class, 'show']);
    Route::put('profile', [PatientProfileController::class, 'update']);

    Route::get('appointments', [PatientAppointmentController::class, 'index']);
    Route::post('appointments', [PatientAppointmentController::class, 'store']);
    Route::get('appointments/{id}', [PatientAppointmentController::class, 'show']);
    Route::put('appointments/{id}', [PatientAppointmentController::class, 'update']);
    Route::delete('appointments/{id}', [PatientAppointmentController::class, 'destroy']);

    Route::get('teleconsultations', [PatientTeleconsultationController::class, 'index']);
    Route::get('ehr', [PatientEhrController::class, 'index']);

    Route::get('invoices', [PatientBillingController::class, 'invoices']);
    Route::post('payments', [PatientBillingController::class, 'pay']);

    Route::get('feedback', [PatientFeedbackController::class, 'index']);
    Route::post('feedback', [PatientFeedbackController::class, 'store']);

    Route::get('notifications', [PatientNotificationController::class, 'index']);

    Route::get('prescriptions', [PatientPrescriptionController::class, 'index']);
    Route::get('prescriptions/{id}', [PatientPrescriptionController::class, 'show']);
});

Route::middleware(['auth:sanctum', 'role:receptionist'])->prefix('receptionist')->group(function () {
    Route::get('dashboard/stats', [ReceptionistDashboardController::class, 'stats']);

    Route::get('patients', [ReceptionistPatientController::class, 'index']);
    Route::post('patients', [ReceptionistPatientController::class, 'store']);
    Route::get('patients/{id}', [ReceptionistPatientController::class, 'show']);
    Route::put('patients/{id}', [ReceptionistPatientController::class, 'update']);
    Route::delete('patients/{id}', [ReceptionistPatientController::class, 'destroy']);

    Route::get('appointments', [ReceptionistAppointmentController::class, 'index']);
    Route::post('appointments', [ReceptionistAppointmentController::class, 'store']);
    Route::get('appointments/{id}', [ReceptionistAppointmentController::class, 'show']);
    Route::put('appointments/{id}', [ReceptionistAppointmentController::class, 'update']);
    Route::post('appointments/{id}/confirm', [ReceptionistAppointmentController::class, 'confirm']);
    Route::delete('appointments/{id}', [ReceptionistAppointmentController::class, 'destroy']);

    Route::get('queue', [ReceptionistQueueController::class, 'index']);
    Route::post('queue/check-in', [ReceptionistQueueController::class, 'checkIn']);
    Route::put('queue/{id}/status', [ReceptionistQueueController::class, 'updateStatus']);

    Route::get('invoices', [ReceptionistInvoiceController::class, 'index']);
    Route::post('invoices', [ReceptionistInvoiceController::class, 'store']);
    Route::get('invoices/{id}', [ReceptionistInvoiceController::class, 'show']);
    Route::put('invoices/{id}', [ReceptionistInvoiceController::class, 'update']);
    Route::delete('invoices/{id}', [ReceptionistInvoiceController::class, 'destroy']);
    Route::post('payments', [ReceptionistPaymentController::class, 'store']);

    Route::get('doctors', [ReceptionistDoctorController::class, 'index']);
    Route::get('doctor-schedules', [ReceptionistDoctorScheduleController::class, 'index']);
    Route::post('doctor-schedules', [ReceptionistDoctorScheduleController::class, 'store']);
    Route::put('doctor-schedules/{id}', [ReceptionistDoctorScheduleController::class, 'update']);
    Route::delete('doctor-schedules/{id}', [ReceptionistDoctorScheduleController::class, 'destroy']);

    Route::get('referrals', [ReceptionistReferralController::class, 'index']);
    Route::post('referrals', [ReceptionistReferralController::class, 'store']);
    Route::get('referrals/{id}', [ReceptionistReferralController::class, 'show']);
    Route::put('referrals/{id}', [ReceptionistReferralController::class, 'update']);
    Route::delete('referrals/{id}', [ReceptionistReferralController::class, 'destroy']);
});
