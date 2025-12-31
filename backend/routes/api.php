<?php



use Illuminate\Http\Request;

use Illuminate\Support\Facades\Route;

<<<<<<< Updated upstream
// --- 1. Import your Controllers ---
use App\Http\Controllers\Api\AuthController;

// NEW: Import the BedController (Ensure the file is in App/Http/Controllers)
use App\Http\Controllers\BedController; 
=======


// --- Controller Imports ---

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
>>>>>>> Stashed changes



// --- Admin Imports (Fixed paths to include \Admin) ---

use App\Http\Controllers\Admin\UserController;

use App\Http\Controllers\Admin\BedController;

use App\Http\Controllers\Admin\AppointmentController; // Added \Admin

use App\Http\Controllers\Admin\DashboardController;   // Added \Admin

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// --- Public Authentication Routes ---
Route::prefix('auth')->group(function () {
    Route::post('register', [AuthController::class, 'register']);
    Route::post('login', [AuthController::class, 'login']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('logout', [AuthController::class, 'logout']);
        Route::get('me', [AuthController::class, 'me']);
    });
});

<<<<<<< Updated upstream
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
=======
// --- ADMIN / GENERAL MANAGEMENT ROUTES ---
Route::middleware(['auth:sanctum'])->group(function () {
    
    // 1. DASHBOARD STATS
    Route::get('/dashboard/stats', [DashboardController::class, 'stats']);

    // 2. User Management Routes
    Route::get('/users', [UserController::class, 'index']);      
    Route::post('/users', [UserController::class, 'store']);     
    Route::delete('/users/{id}', [UserController::class, 'destroy']); 

    // 3. Bed Management Routes
    Route::get('/beds', [BedController::class, 'index']);
    Route::post('/beds/{id}/toggle', [BedController::class, 'toggleStatus']);

    // 4. APPOINTMENT ROUTES
    Route::get('/appointments', [AppointmentController::class, 'index']);
    Route::post('/appointments', [AppointmentController::class, 'store']);
    Route::delete('/appointments/{id}', [AppointmentController::class, 'destroy']);
    
    // Doctor's specific route
    Route::get('/doctor/appointments', [AppointmentController::class, 'myAppointments']);
});

// --- PHARMACY ROUTES (Pharmacist only) ---
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

// --- PATIENT ROUTES (Patient only) ---
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

// --- DEBUG ROUTE (Run this in browser to check Database) ---
Route::get('/debug-db', function() {
    try {
        // 1. Try to create a Ward
        $ward = \App\Models\Ward::firstOrCreate(
            ['name' => 'Debug Ward'],
            ['type' => 'Test', 'capacity' => 1]
        );
        
        // 2. Try to create a Bed
        \App\Models\Bed::create([
            'ward_id' => $ward->id,
            'bed_number' => 'DEBUG-01',
            'is_available' => true 
        ]);

        return "SUCCESS! Database is working perfectly. Go to Manage Wards now.";
    } catch (\Exception $e) {
        return "ERROR: " . $e->getMessage();
    }
});
>>>>>>> Stashed changes
