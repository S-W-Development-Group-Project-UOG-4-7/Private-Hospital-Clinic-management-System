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
use App\Http\Controllers\Api\AppointmentApiController;
use App\Http\Controllers\Api\PatientAccountController;
use App\Http\Controllers\Api\PatientBillingController;
use App\Http\Controllers\Api\PatientDepartmentController;
use App\Http\Controllers\Api\PatientDoctorController;
use App\Http\Controllers\Api\PatientEhrController;
use App\Http\Controllers\Api\PatientFeedbackController;
use App\Http\Controllers\Api\PatientLabResultController;
use App\Http\Controllers\Api\PatientNotificationController;
use App\Http\Controllers\Api\PatientProfileController;
use App\Http\Controllers\Api\PatientPrescriptionController;
use App\Http\Controllers\Api\PatientTeleconsultationController;
use App\Http\Controllers\Api\PatientQueueController;
use App\Http\Controllers\Api\ReceptionistAppointmentController;
use App\Http\Controllers\Api\ReceptionistDashboardController;
use App\Http\Controllers\Api\ReceptionistDepartmentController;
use App\Http\Controllers\Api\ReceptionistDoctorController;
use App\Http\Controllers\Api\ReceptionistDoctorScheduleController;
use App\Http\Controllers\Api\ReceptionistInvoiceController;
use App\Http\Controllers\Api\ReceptionistPatientController;
use App\Http\Controllers\Api\ReceptionistPaymentController;
use App\Http\Controllers\Api\ReceptionistQueueController;
use App\Http\Controllers\Api\ReceptionistReferralController;
use App\Http\Controllers\Api\DoctorAppointmentController;
use App\Http\Controllers\Api\DoctorConsultationController;
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
use App\Http\Controllers\Api\DoctorScheduleController;
use App\Http\Controllers\Api\PharmacistController;
use App\Http\Controllers\Api\PatientController;
use App\Http\Controllers\Api\AIController;
use App\Http\Controllers\Api\PharmacistPatientController;
use App\Http\Controllers\Api\PharmacistReportController;
use App\Http\Controllers\Api\SlotController;
use App\Http\Controllers\Api\TelemedSessionController;
use App\Http\Controllers\Api\AdminSettingsController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

Route::prefix('auth')->group(function () {
    Route::post('register', [AuthController::class, 'register'])->middleware('throttle:10,1');
    Route::post('login', [AuthController::class, 'login'])->middleware('throttle:10,1');
    Route::post('forgot-password', [AuthController::class, 'forgotPassword'])->middleware('throttle:5,1');
    Route::post('reset-password', [AuthController::class, 'resetPassword'])->middleware('throttle:5,1');

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('logout', [AuthController::class, 'logout']);
        Route::get('me', [AuthController::class, 'me']);
    });
});

// Health endpoint
Route::get('health', function () {
    try {
        \Illuminate\Support\Facades\DB::select('select 1');
        $db = 'ok';
    } catch (\Throwable $e) {
        $db = 'error';
    }

    return response()->json([
        'status' => 'ok',
        'time' => now()->toIso8601String(),
        'app' => config('app.name'),
        'env' => config('app.env'),
        'db' => $db,
    ]);
});

// ==========================================
// ADMIN ROUTES
// ==========================================
Route::middleware(['auth:sanctum', 'role:admin', 'permission:admin.access'])->prefix('admin')->group(function () {
    // User Management
    Route::get('/users', [AdminController::class, 'getUsers'])->middleware('permission:admin.users.manage');
    Route::post('/users', [AdminController::class, 'createUser'])->middleware(['permission:admin.users.manage', 'audit']);
    Route::put('/users/{id}', [AdminController::class, 'updateUser'])->middleware(['permission:admin.users.manage', 'audit']);
    Route::patch('/users/{id}/toggle-status', [AdminController::class, 'toggleUserStatus'])->middleware(['permission:admin.users.manage', 'audit']);

    // Reporting & Analytics
    Route::get('/dashboard-stats', [AdminController::class, 'getDashboardStats'])->middleware('permission:admin.reports.view');
    Route::get('/doctor-performance', [AdminController::class, 'getDoctorPerformance'])->middleware('permission:admin.reports.view');

    // Inventory Monitoring (Admin View)
    Route::get('/inventory', [AdminController::class, 'getInventory'])->middleware('permission:admin.inventory.manage');
    Route::post('/inventory', [AdminController::class, 'addDrug'])->middleware(['permission:admin.inventory.manage', 'audit']);
    Route::put('/inventory/{id}', [AdminController::class, 'updateDrug'])->middleware(['permission:admin.inventory.manage', 'audit']);
    Route::delete('/inventory/{id}', [AdminController::class, 'deleteDrug'])->middleware(['permission:admin.inventory.manage', 'audit']);

    // Appointments
    Route::get('/appointments', [AdminController::class, 'getAppointments'])->middleware('permission:admin.appointments.manage');
    Route::put('/appointments/{id}', [AdminController::class, 'updateAppointment'])->middleware(['permission:admin.appointments.manage', 'audit']);
    Route::delete('/appointments/{id}', [AdminController::class, 'deleteAppointment'])->middleware(['permission:admin.appointments.manage', 'audit']);

    // Departments
    Route::get('/departments', [AdminController::class, 'getDepartments'])->middleware('permission:admin.departments.manage');
    Route::post('/departments', [AdminController::class, 'addDepartment'])->middleware(['permission:admin.departments.manage', 'audit']);
    Route::put('/departments/{id}', [AdminController::class, 'updateDepartment'])->middleware(['permission:admin.departments.manage', 'audit']);
    Route::delete('/departments/{id}', [AdminController::class, 'deleteDepartment'])->middleware(['permission:admin.departments.manage', 'audit']);

    // Patient Medical History Reports
    Route::get('/reports/patient/{patientId}', [AdminController::class, 'generatePatientReport'])->middleware('permission:admin.reports.view');
    Route::get('/reports/patients/bulk', [AdminController::class, 'generateBulkPatientReports'])->middleware('permission:admin.reports.view');
    Route::get('/reports/departments/patients', [AdminController::class, 'generateDepartmentPatientReport'])->middleware('permission:admin.reports.view');

    // Admin Reports (CSV supported via ?format=csv)
    Route::get('/reports/appointments', [AdminController::class, 'reportAppointments'])->middleware('permission:admin.reports.view');
    Route::get('/reports/revenue', [AdminController::class, 'reportRevenue'])->middleware('permission:admin.reports.view');
    Route::get('/reports/no-show', [AdminController::class, 'reportNoShowRates'])->middleware('permission:admin.reports.view');
    Route::get('/reports/inventory-valuation', [AdminController::class, 'reportInventoryValuation'])->middleware('permission:admin.reports.view');
    Route::get('/reports/stock-movement', [AdminController::class, 'reportStockMovement'])->middleware('permission:admin.reports.view');

    // Billing (Admin)
    Route::get('/billing/invoices', [ReceptionistInvoiceController::class, 'index'])->middleware('permission:admin.billing.manage');
    Route::post('/billing/invoices', [ReceptionistInvoiceController::class, 'store'])->middleware(['permission:admin.billing.manage', 'audit', 'throttle:30,1']);
    Route::get('/billing/invoices/{id}', [ReceptionistInvoiceController::class, 'show'])->middleware('permission:admin.billing.manage');
    Route::put('/billing/invoices/{id}', [ReceptionistInvoiceController::class, 'update'])->middleware(['permission:admin.billing.manage', 'audit', 'throttle:30,1']);
    Route::delete('/billing/invoices/{id}', [ReceptionistInvoiceController::class, 'destroy'])->middleware(['permission:admin.billing.manage', 'audit', 'throttle:30,1']);
    Route::post('/billing/payments', [ReceptionistPaymentController::class, 'store'])->middleware(['permission:admin.billing.manage', 'audit', 'throttle:30,1']);

    // Settings
    Route::get('/settings', [AdminSettingsController::class, 'index'])->middleware('permission:admin.settings.manage');
    Route::put('/settings', [AdminSettingsController::class, 'update'])->middleware(['permission:admin.settings.manage', 'audit', 'throttle:20,1']);
});

// ==========================================
// PHARMACIST ROUTES
// ==========================================
Route::middleware(['auth:sanctum', 'role:pharmacist'])->prefix('pharmacist')->group(function () {
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
    
    // Inventory helpers
    Route::post('purchase-request', [InventoryController::class, 'createPurchaseRequest']);

    // Prescriptions
    Route::get('prescriptions', [PrescriptionController::class, 'index']);
    Route::get('prescriptions/{id}', [PrescriptionController::class, 'show']);
    Route::post('prescriptions/{id}/interaction-check', [PrescriptionController::class, 'checkInteractions']);
    Route::post('prescriptions/{id}/dispense', [PrescriptionController::class, 'dispense'])->middleware('throttle:20,1');

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
    Route::get('reports/stock-movement', [InventoryController::class, 'stockMovement']);
    
    // Storage Report & Audit
    Route::get('reports/storage', [InventoryController::class, 'storageReport']);
    Route::get('audit-logs', [InventoryController::class, 'auditLogs']);
});

// Public clinic endpoints
Route::get('clinics', [ClinicController::class, 'index']);
Route::get('clinics/{id}/doctors', [ClinicController::class, 'doctors']);
Route::get('clinics/{id}/slots', [ClinicController::class, 'slots']);

// ==========================================
// SHARED APPOINTMENT + SLOT ROUTES
// ==========================================
Route::middleware('auth:sanctum')->group(function () {
    Route::get('slots', [SlotController::class, 'index']);
    Route::post('slots/{slot}/hold', [SlotController::class, 'hold'])->middleware(['role:patient', 'throttle:20,1']);
    Route::post('slots/{slot}/confirm', [SlotController::class, 'confirm'])->middleware(['role:patient', 'throttle:20,1']);

    Route::post('appointments', [ReceptionistAppointmentController::class, 'store'])->middleware(['role:receptionist|admin', 'throttle:30,1']);
    Route::get('appointments/my', [AppointmentApiController::class, 'my'])->middleware('role:patient');
    Route::post('appointments/{id}/cancel', [AppointmentApiController::class, 'cancel'])->middleware(['role:patient|receptionist|admin', 'throttle:30,1']);

    Route::get('doctor/schedule', [DoctorScheduleController::class, 'index'])->middleware('role:doctor');

    Route::get('telemed/appointments/{id}/session', [TelemedSessionController::class, 'show'])->middleware('role:patient|doctor');
    Route::post('telemed/appointments/{id}/session/start', [TelemedSessionController::class, 'start'])->middleware(['role:doctor', 'throttle:20,1']);
    Route::post('telemed/appointments/{id}/session/end', [TelemedSessionController::class, 'end'])->middleware(['role:doctor', 'throttle:20,1']);
});

// ==========================================
// PATIENT ROUTES
// ==========================================
Route::middleware(['auth:sanctum', 'role:patient'])->prefix('patient')->group(function () {
    Route::get('me', [PatientAccountController::class, 'show']);
    Route::put('me', [PatientAccountController::class, 'update']);
    Route::put('password', [PatientAccountController::class, 'updatePassword'])->middleware('throttle:5,1');

    Route::get('profile', [PatientProfileController::class, 'show']);
    Route::put('profile', [PatientProfileController::class, 'update']);

    Route::get('doctors', [PatientDoctorController::class, 'index']);
    Route::get('departments', [PatientDepartmentController::class, 'index']);

    Route::get('appointments', [PatientAppointmentController::class, 'index']);
    Route::post('appointments', [PatientAppointmentController::class, 'store'])->middleware('throttle:20,1');
    Route::get('appointments/{id}', [PatientAppointmentController::class, 'show']);
    Route::put('appointments/{id}', [PatientAppointmentController::class, 'update']);
    Route::delete('appointments/{id}', [PatientAppointmentController::class, 'destroy']);
    Route::post('appointments/{id}/cancel', [PatientAppointmentController::class, 'cancel'])->middleware('throttle:20,1');
    Route::post('appointments/{id}/reschedule', [PatientAppointmentController::class, 'reschedule'])->middleware('throttle:20,1');
    Route::get('appointments/{id}/queue-status', [PatientQueueController::class, 'appointmentStatus']);

    Route::get('slots', [SlotController::class, 'index']);
    Route::post('slots/{slot}/hold', [SlotController::class, 'hold'])->middleware('throttle:20,1');
    Route::post('slots/{slot}/confirm', [SlotController::class, 'confirm'])->middleware('throttle:20,1');

    Route::get('teleconsultations', [PatientTeleconsultationController::class, 'index']);
    Route::get('ehr', [PatientEhrController::class, 'index']);

    Route::get('invoices', [PatientBillingController::class, 'invoices']);
    Route::get('invoices/{id}', [PatientBillingController::class, 'show']);
    Route::get('fees/consultation', [PatientBillingController::class, 'consultationFee']);
    Route::post('payments', [PatientBillingController::class, 'pay'])->middleware('throttle:10,1');

    Route::get('feedback', [PatientFeedbackController::class, 'index']);
    Route::post('feedback', [PatientFeedbackController::class, 'store'])->middleware('throttle:10,1');

    Route::get('notifications', [PatientNotificationController::class, 'index']);

    Route::get('prescriptions', [PatientPrescriptionController::class, 'index']);
    Route::get('prescriptions/{id}', [PatientPrescriptionController::class, 'show']);
    Route::get('lab-results', [PatientLabResultController::class, 'index']);
    Route::get('lab-results/{id}', [PatientLabResultController::class, 'show']);

    Route::get('queue/status', [PatientQueueController::class, 'status']);
    Route::get('queue/clinic/{clinicId}', [PatientQueueController::class, 'clinicQueue']);
});

// ==========================================
// RECEPTIONIST ROUTES
// ==========================================
Route::middleware(['auth:sanctum', 'role:receptionist'])->prefix('receptionist')->group(function () {
    Route::get('dashboard/stats', [ReceptionistDashboardController::class, 'stats']);

    Route::get('patients', [ReceptionistPatientController::class, 'index']);
    Route::post('patients', [ReceptionistPatientController::class, 'store'])->middleware('throttle:30,1');
    Route::post('patients/generate-random', [ReceptionistPatientController::class, 'generateRandom']);
    Route::get('patients/{id}', [ReceptionistPatientController::class, 'show']);
    Route::put('patients/{id}', [ReceptionistPatientController::class, 'update']);
    Route::delete('patients/{id}', [ReceptionistPatientController::class, 'destroy']);

    Route::get('appointments', [ReceptionistAppointmentController::class, 'index']);
    Route::post('appointments', [ReceptionistAppointmentController::class, 'store'])->middleware('throttle:30,1');
    Route::get('appointments/{id}', [ReceptionistAppointmentController::class, 'show']);
    Route::put('appointments/{id}', [ReceptionistAppointmentController::class, 'update']);
    Route::post('appointments/{id}/confirm', [ReceptionistAppointmentController::class, 'confirm'])->middleware('throttle:30,1');
    Route::delete('appointments/{id}', [ReceptionistAppointmentController::class, 'destroy']);

    Route::get('queue', [ReceptionistQueueController::class, 'index']);
    Route::post('queue/check-in', [ReceptionistQueueController::class, 'checkIn'])->middleware('throttle:60,1');
    Route::post('queue/call-next', [ReceptionistQueueController::class, 'callNext'])->middleware('throttle:60,1');
    Route::post('queue/{id}/skip', [ReceptionistQueueController::class, 'skip'])->middleware('throttle:60,1');
    Route::post('queue/{id}/requeue', [ReceptionistQueueController::class, 'requeue'])->middleware('throttle:60,1');
    Route::post('queue/{id}/no-show', [ReceptionistQueueController::class, 'markNoShow'])->middleware('throttle:60,1');
    Route::post('queue/clear', [ReceptionistQueueController::class, 'clear'])->middleware('throttle:60,1');
    Route::put('queue/{id}/status', [ReceptionistQueueController::class, 'updateStatus']);

    Route::get('invoices', [ReceptionistInvoiceController::class, 'index']);
    Route::post('invoices', [ReceptionistInvoiceController::class, 'store'])->middleware('throttle:30,1');
    Route::get('invoices/{id}', [ReceptionistInvoiceController::class, 'show']);
    Route::put('invoices/{id}', [ReceptionistInvoiceController::class, 'update'])->middleware('throttle:30,1');
    Route::delete('invoices/{id}', [ReceptionistInvoiceController::class, 'destroy'])->middleware('throttle:30,1');
    Route::post('payments', [ReceptionistPaymentController::class, 'store'])->middleware('throttle:30,1');

    Route::get('departments', [ReceptionistDepartmentController::class, 'index']);
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
    Route::get('appointments/{id}/consultation', [DoctorConsultationController::class, 'show']);
    Route::post('appointments/{id}/consultation', [DoctorConsultationController::class, 'upsert']);
    Route::post('appointments/{id}/consultation/start', [DoctorConsultationController::class, 'start']);
    Route::post('appointments/{id}/consultation/complete', [DoctorConsultationController::class, 'complete']);

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
    Route::get('labs/orders', [DoctorLabController::class, 'index']);
    Route::get('labs/orders/{id}', [DoctorLabController::class, 'show']);
    Route::put('labs/orders/{id}', [DoctorLabController::class, 'updateOrder']);
    Route::delete('labs/orders/{id}', [DoctorLabController::class, 'destroyOrder']);
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
    Route::get('patients', [DoctorPatientController::class, 'index']);
    Route::post('patients', [DoctorPatientController::class, 'store']);

    // Inventory
    Route::get('inventory', [InventoryController::class, 'index']);


    // Queue
    Route::get('queue', [DoctorQueueController::class, 'index']);
    Route::get('queue/next', [DoctorQueueController::class, 'next']);
    Route::post('queue/call-next', [DoctorQueueController::class, 'callNext']);
    Route::put('queue/{id}/status', [DoctorQueueController::class, 'updateStatus']);
    Route::post('queue/{id}/skip', [DoctorQueueController::class, 'skip']);
    Route::post('queue/{id}/requeue', [DoctorQueueController::class, 'requeue']);
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
        Route::post('chat', [AIController::class, 'chat'])->middleware('throttle:10,1');
        Route::post('medical/analysis', [AIController::class, 'medicalAnalysis'])->middleware('throttle:10,1');
        Route::post('medical/drug-interactions', [AIController::class, 'drugInteractions'])->middleware('throttle:10,1');
        Route::post('medical/diagnostics', [AIController::class, 'diagnostics'])->middleware('throttle:10,1');
        Route::post('medical/prescription-review', [AIController::class, 'prescriptionReview'])->middleware('throttle:10,1');
        Route::post('patient/insights', [AIController::class, 'patientInsights'])->middleware('throttle:10,1');
        Route::post('documents/generate', [AIController::class, 'generateDocument'])->middleware('throttle:10,1');
        Route::get('status', [AIController::class, 'getStatus']);
        Route::get('features', [AIController::class, 'getFeatures']);
    });
});
