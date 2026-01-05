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
use App\Http\Controllers\Api\DoctorAppointmentController;
use App\Http\Controllers\Api\DoctorTeleconsultationController;
use App\Http\Controllers\Api\DoctorEhrController;
use App\Http\Controllers\Api\DoctorVitalSignController;
use App\Http\Controllers\Api\DoctorDiagnosisController;
use App\Http\Controllers\Api\DoctorPrescriptionController;
use App\Http\Controllers\Api\DoctorLabController;
use App\Http\Controllers\Api\DoctorReferralController;
use App\Http\Controllers\Api\DoctorPatientController;
use App\Http\Controllers\Api\ClinicController;

Route::prefix('auth')->group(function () {
    Route::post('register', [AuthController::class, 'register']);
    Route::post('login', [AuthController::class, 'login']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('logout', [AuthController::class, 'logout']);
        Route::get('me', [AuthController::class, 'me']);
    });
});

// Pharmacy & Inventory Management Routes (Pharmacist only)
Route::middleware(['auth:sanctum', 'role:pharmacist'])->prefix('pharmacist')->group(function () {
    // Prescriptions
    Route::get('prescriptions', [PrescriptionController::class, 'index']);
    Route::get('prescriptions/{id}', [PrescriptionController::class, 'show']);
    Route::post('prescriptions/{id}/interaction-check', [PrescriptionController::class, 'checkInteractions']);
    Route::post('prescriptions/{id}/dispense', [PrescriptionController::class, 'dispense']);
    
    // Inventory
    Route::get('inventory', [InventoryController::class, 'index']);
    Route::post('inventory/update', [InventoryController::class, 'update']);
    Route::get('inventory/low-stock', [InventoryController::class, 'lowStock']);
    Route::post('purchase-request', [InventoryController::class, 'createPurchaseRequest']);
    
    // Controlled Substances
    Route::get('controlled-drugs', [InventoryController::class, 'controlledDrugs']);
    Route::post('controlled-drugs/log', [InventoryController::class, 'logControlledDrug']);
    
    // Labels
    Route::post('labels/generate', [PrescriptionController::class, 'generateLabel']);
    Route::post('labels/print', [PrescriptionController::class, 'printLabel']);
    
    // Returns
    Route::post('returns', [InventoryController::class, 'processReturn']);
    Route::get('returns', [InventoryController::class, 'getReturns']);
    
    // Reports & Audit
    Route::get('reports/inventory', [InventoryController::class, 'inventoryReport']);
    Route::get('reports/storage', [InventoryController::class, 'storageReport']);
    Route::get('audit-logs', [InventoryController::class, 'auditLogs']);
});

// Public clinic endpoints
Route::get('clinics', [ClinicController::class, 'index']);
Route::get('clinics/{id}/doctors', [ClinicController::class, 'doctors']);
Route::get('clinics/{id}/slots', [ClinicController::class, 'slots']);

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

// Doctor Portal Routes (Doctor only)
Route::middleware(['auth:sanctum', 'role:doctor'])->prefix('doctor')->group(function () {
    // Appointments
    Route::get('appointments', [DoctorAppointmentController::class, 'index']);
    Route::get('appointments/{id}', [DoctorAppointmentController::class, 'show']);
    Route::put('appointments/{id}/status', [DoctorAppointmentController::class, 'updateStatus']);

    // Teleconsultations
    Route::post('teleconsultations/start', [DoctorTeleconsultationController::class, 'start']);
    Route::post('teleconsultations/{id}/end', [DoctorTeleconsultationController::class, 'end']);

    // EHR / Patient Records
    Route::get('patients/{id}/ehr', [DoctorEhrController::class, 'getPatientEhr']);

    // Vital Signs
    Route::post('vitals', [DoctorVitalSignController::class, 'store']);
    Route::put('vitals/{id}', [DoctorVitalSignController::class, 'update']);
    Route::delete('vitals/{id}', [DoctorVitalSignController::class, 'destroy']);

    // Diagnoses
    Route::post('diagnoses', [DoctorDiagnosisController::class, 'store']);
    Route::put('diagnoses/{id}', [DoctorDiagnosisController::class, 'update']);
    Route::get('diagnoses/patient/{id}', [DoctorDiagnosisController::class, 'getPatientDiagnoses']);

    // Prescriptions
    Route::post('prescriptions', [DoctorPrescriptionController::class, 'store']);
    Route::get('prescriptions', [DoctorPrescriptionController::class, 'index']);
    Route::get('prescriptions/{id}', [DoctorPrescriptionController::class, 'show']);

    // Lab Orders & Results
    Route::post('labs/orders', [DoctorLabController::class, 'createOrder']);
    Route::get('labs/results/{patientId}', [DoctorLabController::class, 'getPatientResults']);
    Route::post('labs/results/{id}/review', [DoctorLabController::class, 'reviewResult']);

    // Referrals
    Route::post('referrals', [DoctorReferralController::class, 'store']);
    Route::get('referrals', [DoctorReferralController::class, 'index']);

    // Patients (Doctor can register patients)
    Route::post('patients', [DoctorPatientController::class, 'store']);

    // Inventory (read-only for prescriptions)
    Route::get('inventory', [InventoryController::class, 'index']);
});
