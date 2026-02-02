<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// --- Imports ---
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\AdminController;
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
use App\Http\Controllers\Api\DoctorQueueController;
use App\Http\Controllers\Api\DoctorClinicReferralController;
use App\Http\Controllers\Api\DoctorDashboardController;
use App\Http\Controllers\Api\ClinicController;
use App\Http\Controllers\Api\PharmacistController;
use App\Http\Controllers\Api\PatientController;
use App\Http\Controllers\Api\AIController;
use App\Http\Controllers\Api\PharmacistPatientController;
use App\Http\Controllers\Api\PharmacistReportController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

Route::prefix('auth')->group(function () {
    Route::post('register', [AuthController::class, 'register']);
    Route::post('login', [AuthController::class, 'login']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('logout', [AuthController::class, 'logout']);
        Route::get('me', [AuthController::class, 'me']);
    });
});

// ==========================================
// ADMIN ROUTES
// ==========================================
Route::middleware(['auth:sanctum', 'role:admin'])->prefix('admin')->group(function () {
    // User Management
    Route::get('/users', [AdminController::class, 'getUsers']);
    Route::post('/users', [AdminController::class, 'createUser']);
    Route::put('/users/{id}', [AdminController::class, 'updateUser']);
    Route::patch('/users/{id}/toggle-status', [AdminController::class, 'toggleUserStatus']);

    // Reporting & Analytics
    Route::get('/dashboard-stats', [AdminController::class, 'getDashboardStats']);
    Route::get('/doctor-performance', [AdminController::class, 'getDoctorPerformance']);

    // Inventory Monitoring (Admin View)
    Route::get('/inventory', [AdminController::class, 'getInventory']);
    Route::post('/inventory', [AdminController::class, 'addDrug']);
    Route::put('/inventory/{id}', [AdminController::class, 'updateDrug']);
    Route::delete('/inventory/{id}', [AdminController::class, 'deleteDrug']);

    // Appointments
    Route::get('/appointments', [AdminController::class, 'getAppointments']);
    Route::put('/appointments/{id}', [AdminController::class, 'updateAppointment']);
    Route::delete('/appointments/{id}', [AdminController::class, 'deleteAppointment']);

    // Departments
    Route::get('/departments', [AdminController::class, 'getDepartments']);
    Route::post('/departments', [AdminController::class, 'addDepartment']);
    Route::put('/departments/{id}', [AdminController::class, 'updateDepartment']);
    Route::delete('/departments/{id}', [AdminController::class, 'deleteDepartment']);

    // Patient Medical History Reports
    Route::get('/reports/patient/{patientId}', [AdminController::class, 'generatePatientReport']);
    Route::get('/reports/patients/bulk', [AdminController::class, 'generateBulkPatientReports']);
    Route::get('/reports/departments/patients', [AdminController::class, 'generateDepartmentPatientReport']);
});

// ==========================================
// PHARMACIST ROUTES
// ==========================================
Route::middleware(['auth:sanctum', 'role:pharmacist'])->prefix('pharmacist')->group(function () {

    // --- UPDATED INVENTORY & DISPENSING SECTION ---
    Route::get('inventory', [PharmacistController::class, 'index']);
    Route::post('inventory/{id}/dispense', [PharmacistController::class, 'dispense']);

    // Standard Inventory Management
    // Prescriptions
    Route::get('prescriptions', [PrescriptionController::class, 'index']);
    Route::get('prescriptions/{id}', [PrescriptionController::class, 'show']);
    Route::post('prescriptions/{id}/interaction-check', [PrescriptionController::class, 'checkInteractions']);
    Route::post('prescriptions/{id}/dispense', [PrescriptionController::class, 'dispense']);
    
    // Inventory - Specific routes MUST come before {id} route
    Route::get('inventory', [InventoryController::class, 'index']);
    Route::get('inventory/low-stock', [InventoryController::class, 'lowStock']);
    Route::get('inventory/expiring-soon', [InventoryController::class, 'expiringSoon']);
    Route::get('inventory/stats', [InventoryController::class, 'stats']);
    Route::post('inventory', [InventoryController::class, 'store']);
    Route::get('inventory/{id}', [InventoryController::class, 'show']);
    Route::put('inventory/{id}', [InventoryController::class, 'update']);
    Route::delete('inventory/{id}', [InventoryController::class, 'destroy']);
    Route::post('inventory/update', [InventoryController::class, 'update']);

    // Statistics & Helpers
    Route::get('inventory/low-stock', [InventoryController::class, 'lowStock']);
    Route::get('inventory/expiring-soon', [InventoryController::class, 'expiringSoon']);
    Route::get('inventory/stats', [InventoryController::class, 'stats']);
    Route::post('purchase-request', [InventoryController::class, 'createPurchaseRequest']);

    // Prescriptions
    Route::get('prescriptions', [PrescriptionController::class, 'index']);
    Route::get('prescriptions/{id}', [PrescriptionController::class, 'show']);
    Route::post('prescriptions/{id}/interaction-check', [PrescriptionController::class, 'checkInteractions']);
    Route::post('prescriptions/{id}/dispense', [PrescriptionController::class, 'dispense']);

    // Controlled Substances
    Route::get('controlled-drugs', [InventoryController::class, 'controlledDrugs']);
    Route::post('controlled-drugs/log', [InventoryController::class, 'logControlledDrug']);

    // Labels
    Route::post('labels/generate', [PrescriptionController::class, 'generateLabel']);
    Route::post('labels/print', [PrescriptionController::class, 'printLabel']);

    // Returns
    Route::post('returns', [InventoryController::class, 'processReturn']);
    Route::get('returns', [InventoryController::class, 'getReturns']);


    // Patients (view basic patient info and medication history)
    Route::get('patients', [PharmacistPatientController::class, 'index']);
    Route::get('patients/{id}', [PharmacistPatientController::class, 'show']);
    Route::get('patients/{id}/medication-history', [PharmacistPatientController::class, 'medicationHistory']);
    Route::get('patients/{id}/medication-summary', [PharmacistPatientController::class, 'medicationSummary']);
    
    // Reports & Analytics
    Route::get('reports/dispensing', [PharmacistReportController::class, 'dispensingReport']);
    Route::get('reports/inventory', [PharmacistReportController::class, 'inventoryReport']);
    Route::get('reports/sales', [PharmacistReportController::class, 'salesReport']);
    Route::get('reports/patient-activity', [PharmacistReportController::class, 'patientActivityReport']);
    
    // Storage Report & Audit
    Route::get('reports/storage', [InventoryController::class, 'storageReport']);
    Route::get('audit-logs', [InventoryController::class, 'auditLogs']);
});

// Public clinic endpoints
Route::get('clinics', [ClinicController::class, 'index']);
Route::get('clinics/{id}/doctors', [ClinicController::class, 'doctors']);
Route::get('clinics/{id}/slots', [ClinicController::class, 'slots']);

// ==========================================
// PATIENT ROUTES
// ==========================================
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

// ==========================================
// RECEPTIONIST ROUTES
// ==========================================
Route::middleware(['auth:sanctum', 'role:receptionist'])->prefix('receptionist')->group(function () {
    Route::get('dashboard/stats', [ReceptionistDashboardController::class, 'stats']);

    Route::get('patients', [ReceptionistPatientController::class, 'index']);
    Route::post('patients', [ReceptionistPatientController::class, 'store']);
    Route::post('patients/generate-random', [ReceptionistPatientController::class, 'generateRandom']);
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
    Route::post('queue/clear', [ReceptionistQueueController::class, 'clear']);
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

// ==========================================
// DOCTOR ROUTES
// ==========================================
Route::middleware(['auth:sanctum', 'role:doctor'])->prefix('doctor')->group(function () {
    // Dashboard / Daily Summary
    Route::get('dashboard/daily-summary', [DoctorDashboardController::class, 'dailySummary']);

    // Appointments
    Route::get('appointments', [DoctorAppointmentController::class, 'index']);
    Route::get('appointments/{id}', [DoctorAppointmentController::class, 'show']);
    Route::put('appointments/{id}/status', [DoctorAppointmentController::class, 'updateStatus']);

    // Teleconsultations
    Route::post('teleconsultations/start', [DoctorTeleconsultationController::class, 'start']);
    Route::post('teleconsultations/{id}/end', [DoctorTeleconsultationController::class, 'end']);

    // EHR / Patient Records
    // --- THIS IS THE CRITICAL LINE FOR YOUR FRONTEND ---
    Route::get('patients/{id}/history', [DoctorEhrController::class, 'getPatientEhr']);
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
    Route::put('prescriptions/{id}', [DoctorPrescriptionController::class, 'update']);
    Route::delete('prescriptions/{id}', [DoctorPrescriptionController::class, 'destroy']);

    // Lab Orders & Results
    Route::post('labs/orders', [DoctorLabController::class, 'createOrder']);
    Route::get('labs/results/{patientId}', [DoctorLabController::class, 'getPatientResults']);
    Route::post('labs/results/{id}/review', [DoctorLabController::class, 'reviewResult']);

    // Referrals
    Route::post('referrals', [DoctorReferralController::class, 'store']);
    Route::get('referrals', [DoctorReferralController::class, 'index']);

    // Patients
    // Clinic Referrals
    Route::post('clinic-referrals', [DoctorClinicReferralController::class, 'store']);
    Route::get('clinic-referrals', [DoctorClinicReferralController::class, 'index']);

    // Patients (Doctor can register patients)
    Route::post('patients', [DoctorPatientController::class, 'store']);

    // Inventory
    Route::get('inventory', [InventoryController::class, 'index']);


    // Queue
    Route::get('queue', [DoctorQueueController::class, 'index']);
    Route::get('queue/next', [DoctorQueueController::class, 'next']);
    Route::post('queue/call-next', [DoctorQueueController::class, 'callNext']);
    Route::put('queue/{id}/status', [DoctorQueueController::class, 'updateStatus']);
});


// Patient API (for doctors and staff to search patients)
Route::middleware('auth:sanctum')->group(function () {
    Route::prefix('patients')->group(function () {
        Route::get('search', [PatientController::class, 'searchByPhone']);
        Route::get('{id}', [PatientController::class, 'show']);
    });
});

// AI-Powered Routes (GPT-5.2-Codex)
Route::middleware('auth:sanctum')->group(function () {
    Route::prefix('ai')->group(function () {
        Route::post('chat', [AIController::class, 'chat']);
        Route::post('medical/analysis', [AIController::class, 'medicalAnalysis']);
        Route::post('medical/drug-interactions', [AIController::class, 'drugInteractions']);
        Route::post('medical/diagnostics', [AIController::class, 'diagnostics']);
        Route::post('medical/prescription-review', [AIController::class, 'prescriptionReview']);
        Route::post('patient/insights', [AIController::class, 'patientInsights']);
        Route::post('documents/generate', [AIController::class, 'generateDocument']);
        Route::get('status', [AIController::class, 'getStatus']);
        Route::get('features', [AIController::class, 'getFeatures']);
    });
});
