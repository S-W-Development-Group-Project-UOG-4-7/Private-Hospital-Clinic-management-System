<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Appointment;
use App\Models\Drug;
use App\Models\Department;
use App\Models\EhrRecord;
use App\Models\Diagnosis;
use App\Models\VitalSign;
use App\Models\Prescription;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;

class AdminController extends Controller
{
    // ==========================================
    // 1. USER MANAGEMENT
    // ==========================================

    public function getUsers()
    {
        // FIX: Use 'roles' (Spatie relationship) instead of 'role' (Scope conflict)
        $users = User::with(['roles', 'department'])->latest()->get()->map(function ($user) {
            return [
                'id' => $user->id,
                'name' => trim(($user->first_name ?? '') . ' ' . ($user->last_name ?? '')),
                'username' => $user->username,
                'email' => $user->email,
                // Get the first role name from the collection
                'role' => $user->roles->first()->name ?? 'patient',
                'department' => $user->department->name ?? '-',
                'is_active' => $user->is_active,
                'created_at' => $user->created_at->format('Y-m-d'),
            ];
        });

        return response()->json($users);
    }

    public function createUser(Request $request)
    {
        $validated = $request->validate([
            'first_name' => 'required|string',
            'last_name' => 'required|string',
            'email' => 'required|email|unique:users',
            'password' => 'required|min:8',
            'role' => 'required|exists:roles,name',
            'department_id' => 'nullable|integer|exists:departments,id',
        ]);

        $username = strtolower($validated['first_name'] . ($validated['last_name'] ? '.' . $validated['last_name'] : '')) . rand(10, 99);

        $user = User::create([
            'first_name' => $validated['first_name'],
            'last_name' => $validated['last_name'],
            'email' => $validated['email'],
            'username' => $username,
            'password' => Hash::make($validated['password']),
            'is_active' => true,
            'department_id' => $validated['department_id'] ?? null,
        ]);

        $user->assignRole($validated['role']);

        return response()->json(['message' => 'User created successfully', 'user' => $user]);
    }

    public function updateUser(Request $request, $id)
    {
        $user = User::findOrFail($id);

        $validated = $request->validate([
            'first_name' => 'sometimes|string',
            'last_name' => 'sometimes|string',
            'email' => 'sometimes|email|unique:users,email,' . $id,
            'role' => 'sometimes|exists:roles,name',
            'department_id' => 'nullable|integer|exists:departments,id',
        ]);

        $user->update($request->only(['first_name', 'last_name', 'email', 'department_id']));

        if ($request->has('role')) {
            $user->syncRoles([$request->role]);
        }

        return response()->json(['message' => 'User updated successfully']);
    }

    public function toggleUserStatus($id)
    {
        $user = User::findOrFail($id);

        $currentUser = Auth::user();
        if ($currentUser && $user->id === $currentUser->id) {
            return response()->json(['message' => 'You cannot deactivate your own account.'], 403);
        }

        $user->is_active = !$user->is_active;
        $user->save();

        $status = $user->is_active ? 'activated' : 'deactivated';
        return response()->json(['message' => "User account $status."]);
    }

    // ==========================================
    // 2. REPORTING & ANALYTICS (DASHBOARD)
    // ==========================================

    public function getDashboardStats()
    {
        // 1. Chart Data: Last 7 Days
        $chartData = [];
        for ($i = 6; $i >= 0; $i--) {
            $date = Carbon::now()->subDays($i);
            $count = Appointment::whereDate('appointment_date', $date->format('Y-m-d'))->count();

            $chartData[] = [
                'name' => $date->format('D'), // Mon, Tue, Wed...
                'patients' => $count
            ];
        }

        // 2. Counts - Using Spatie scopes (User::role) is correct here
        $totalUsers = User::count();
        $totalPatients = User::role('patient')->count();
        $totalDoctors = User::role('doctor')->count();
        $totalStaff = User::role(['receptionist', 'pharmacist'])->count();
        $totalDepartments = Department::count();

        return response()->json([
            'counts' => [
                'total_users' => $totalUsers,
                'total_doctors' => $totalDoctors,
                'total_patients' => $totalPatients,
                'total_staff' => $totalStaff,
                'total_departments' => $totalDepartments,
            ],
            'chart_data' => $chartData
        ]);
    }

    public function getDoctorPerformance()
    {
        $performance = Appointment::where('status', 'Completed')
            ->select('doctor_id', DB::raw('count(*) as total_appointments'))
            ->with('doctor')
            ->groupBy('doctor_id')
            ->orderByDesc('total_appointments')
            ->take(5)
            ->get()
            ->map(function ($item) {
                return [
                    'doctor_name' => $item->doctor ? ($item->doctor->first_name . ' ' . $item->doctor->last_name) : 'Unknown Doctor',
                    'total_appointments' => $item->total_appointments
                ];
            });

        return response()->json($performance);
    }

    // ==========================================
    // 3. INVENTORY MANAGEMENT
    // ==========================================

    public function getInventory()
    {
        $inventory = Drug::select('id', 'name', 'stock_quantity', 'expiry_date')
            ->orderBy('stock_quantity', 'asc')
            ->get()
            ->map(function($drug) {
                return [
                    'id' => $drug->id,
                    'name' => $drug->name,
                    'stock' => $drug->stock_quantity,
                    'status' => $drug->stock_quantity < 10 ? 'Low Stock' : 'In Stock',
                    'expiry' => $drug->expiry_date
                ];
            });

        return response()->json($inventory);
    }

    public function addDrug(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string',
            'stock_quantity' => 'required|integer|min:0',
            'expiry_date' => 'required|date',
        ]);

        $drug = Drug::create($validated);
        return response()->json(['message' => 'Medicine added successfully', 'drug' => $drug]);
    }

    public function updateDrug(Request $request, $id)
    {
        $drug = Drug::findOrFail($id);
        $validated = $request->validate([
            'name' => 'required|string',
            'stock_quantity' => 'required|integer|min:0',
            'expiry_date' => 'required|date',
        ]);

        $drug->update($validated);
        return response()->json(['message' => 'Medicine updated successfully', 'drug' => $drug]);
    }

    public function deleteDrug($id)
    {
        $drug = Drug::findOrFail($id);
        $drug->delete();
        return response()->json(['message' => 'Medicine deleted successfully']);
    }

    // ==========================================
    // 4. DEPARTMENT MANAGEMENT
    // ==========================================

    public function getDepartments()
    {
        $departments = Department::with('doctors')->get()->map(function($dept) {
            return [
                'id' => $dept->id,
                'name' => $dept->name,
                'description' => $dept->description,
                'status' => $dept->status,
                'doctor_count' => $dept->doctors->count(),
                'doctors' => $dept->doctors->map(function($doc) {
                    return ['id' => $doc->id, 'name' => $doc->first_name . ' ' . $doc->last_name];
                })
            ];
        });

        return response()->json($departments);
    }

    public function addDepartment(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|unique:departments',
            'description' => 'nullable|string',
            'status' => 'nullable|string|in:Active,Inactive'
        ]);

        $dept = Department::create($validated);
        return response()->json(['message' => 'Department created', 'department' => $dept]);
    }

    public function updateDepartment(Request $request, $id)
    {
        $dept = Department::findOrFail($id);
        $validated = $request->validate([
            'name' => 'required|string|unique:departments,name,' . $id,
            'description' => 'nullable|string',
            'status' => 'required|string|in:Active,Inactive'
        ]);

        $dept->update($validated);
        return response()->json(['message' => 'Department updated', 'department' => $dept]);
    }

    public function deleteDepartment($id)
    {
        $dept = Department::findOrFail($id);
        if ($dept->doctors()->exists()) {
             return response()->json(['message' => 'Cannot delete department with assigned doctors.'], 400);
        }
        $dept->delete();
        return response()->json(['message' => 'Department deleted']);
    }

    // ==========================================
    // 5. APPOINTMENT MANAGEMENT
    // ==========================================

    public function getAppointments()
    {
        $appointments = Appointment::with(['patient', 'doctor', 'department'])
            ->orderBy('appointment_date', 'desc')
            ->get();

        $formatted = $appointments->map(function($appt) {
            return [
                'id' => $appt->id,
                'patient_name' => $appt->patient ? ($appt->patient->first_name . ' ' . $appt->patient->last_name) : 'Unknown',
                'doctor_name' => $appt->doctor ? ($appt->doctor->first_name . ' ' . $appt->doctor->last_name) : 'Unknown',
                'department' => $appt->department ? $appt->department->name : '-',
                'appointment_date' => $appt->appointment_date,
                'appointment_time' => $appt->appointment_time,
                'status' => $appt->status,
                'type' => $appt->type,
                'reason' => $appt->reason,
                'notes' => $appt->notes
            ];
        });

        return response()->json($formatted);
    }

    public function updateAppointment(Request $request, $id)
    {
        $appointment = Appointment::findOrFail($id);

        $validated = $request->validate([
            'appointment_date' => 'sometimes|date',
            'appointment_time' => 'sometimes|string',
            'doctor_id'        => 'nullable|exists:users,id',
            'department_id'    => 'nullable|exists:departments,id',
            'status'           => 'sometimes|string',
            'type'             => 'sometimes|string',
            'reason'           => 'nullable|string',
            'notes'            => 'nullable|string',
        ]);

        $appointment->update($validated);

        return response()->json([
            'message' => 'Appointment updated successfully',
            'appointment' => $appointment->fresh(['doctor', 'department', 'patient'])
        ]);
    }

    public function deleteAppointment($id)
    {
        $appointment = Appointment::findOrFail($id);
        $appointment->delete();
        return response()->json(['message' => 'Appointment deleted successfully']);
    }

    // ==========================================
    // 6. PATIENT MEDICAL HISTORY REPORTS
    // ==========================================

    public function generatePatientReport($patientId, Request $request)
    {
        $patient = User::role('patient')
            ->with(['patientProfile', 'clinic', 'department'])
            ->findOrFail($patientId);

        $startDate = $request->get('start_date');
        $endDate = $request->get('end_date');

        $dateFilter = function($query) use ($startDate, $endDate) {
            if ($startDate) {
                $query->whereDate('created_at', '>=', $startDate);
            }
            if ($endDate) {
                $query->whereDate('created_at', '<=', $endDate);
            }
        };

        $appointments = Appointment::where('patient_id', $patientId)
            ->with(['doctor:id,first_name,last_name', 'department:id,name'])
            ->when($startDate || $endDate, $dateFilter)
            ->orderBy('appointment_date', 'desc')
            ->get();

        $ehrRecords = EhrRecord::where('patient_id', $patientId)
            ->with(['doctor:id,first_name,last_name'])
            ->when($startDate || $endDate, $dateFilter)
            ->orderBy('record_date', 'desc')
            ->get();

        $diagnoses = Diagnosis::where('patient_id', $patientId)
            ->with(['doctor:id,first_name,last_name', 'appointment:id,appointment_date'])
            ->when($startDate || $endDate, $dateFilter)
            ->orderBy('diagnosis_date', 'desc')
            ->get();

        $vitalSigns = VitalSign::where('patient_id', $patientId)
            ->with(['doctor:id,first_name,last_name', 'appointment:id,appointment_date'])
            ->when($startDate || $endDate, $dateFilter)
            ->orderBy('recorded_at', 'desc')
            ->get();

        $prescriptions = Prescription::where('patient_id', $patientId)
            ->with([
                'doctor:id,first_name,last_name',
                'pharmacist:id,first_name,last_name',
                'items.inventoryItem:id,name,dosage,unit'
            ])
            ->when($startDate || $endDate, $dateFilter)
            ->orderBy('prescription_date', 'desc')
            ->get();

        $stats = [
            'total_appointments' => $appointments->count(),
            'completed_appointments' => $appointments->where('status', 'Completed')->count(),
            'cancelled_appointments' => $appointments->where('status', 'Cancelled')->count(),
            'total_diagnoses' => $diagnoses->count(),
            'active_diagnoses' => $diagnoses->where('status', 'active')->count(),
            'resolved_diagnoses' => $diagnoses->where('status', 'resolved')->count(),
            'total_prescriptions' => $prescriptions->count(),
            'dispensed_prescriptions' => $prescriptions->where('status', 'dispensed')->count(),
            'vital_sign_records' => $vitalSigns->count(),
        ];

        return response()->json([
            'patient_info' => [
                'id' => $patient->id,
                'name' => trim(($patient->first_name ?? '') . ' ' . ($patient->last_name ?? '')),
                'email' => $patient->email,
                'username' => $patient->username,
                'clinic' => $patient->clinic?->name ?? '-',
                'department' => $patient->department?->name ?? '-',
                'profile' => $patient->patientProfile,
            ],
            'date_range' => [
                'start_date' => $startDate,
                'end_date' => $endDate,
            ],
            'statistics' => $stats,
            'medical_data' => [
                'appointments' => $appointments->map(function($appt) {
                    return [
                        'id' => $appt->id,
                        'date' => $appt->appointment_date,
                        'time' => $appt->appointment_time,
                        'doctor' => $appt->doctor ? ($appt->doctor->first_name . ' ' . $appt->doctor->last_name) : 'Unknown',
                        'department' => $appt->department?->name ?? '-',
                        'status' => $appt->status,
                        'type' => $appt->type,
                        'reason' => $appt->reason,
                        'notes' => $appt->notes,
                    ];
                }),
                'ehr_records' => $ehrRecords->map(function($ehr) {
                    return [
                        'id' => $ehr->id,
                        'type' => $ehr->type,
                        'title' => $ehr->title,
                        'details' => $ehr->details,
                        'date' => $ehr->record_date,
                        'doctor' => $ehr->doctor ? ($ehr->doctor->first_name . ' ' . $ehr->doctor->last_name) : 'Unknown',
                        'file_url' => $ehr->file_url,
                    ];
                }),
                'diagnoses' => $diagnoses->map(function($diag) {
                    return [
                        'id' => $diag->id,
                        'icd10_code' => $diag->icd10_code,
                        'icd10_description' => $diag->icd10_description,
                        'diagnosis_name' => $diag->diagnosis_name,
                        'description' => $diag->description,
                        'status' => $diag->status,
                        'diagnosis_date' => $diag->diagnosis_date,
                        'resolved_date' => $diag->resolved_date,
                        'doctor' => $diag->doctor ? ($diag->doctor->first_name . ' ' . $diag->doctor->last_name) : 'Unknown',
                        'appointment_date' => $diag->appointment?->appointment_date,
                        'notes' => $diag->notes,
                    ];
                }),
                'vital_signs' => $vitalSigns->map(function($vital) {
                    return [
                        'id' => $vital->id,
                        'recorded_at' => $vital->recorded_at,
                        'blood_pressure' => ($vital->blood_pressure_systolic && $vital->blood_pressure_diastolic)
                            ? $vital->blood_pressure_systolic . '/' . $vital->blood_pressure_diastolic
                            : null,
                        'heart_rate' => $vital->heart_rate,
                        'temperature' => $vital->temperature,
                        'weight' => $vital->weight,
                        'height' => $vital->height,
                        'respiratory_rate' => $vital->respiratory_rate,
                        'oxygen_saturation' => $vital->oxygen_saturation,
                        'symptoms' => $vital->symptoms,
                        'notes' => $vital->notes,
                        'doctor' => $vital->doctor ? ($vital->doctor->first_name . ' ' . $vital->doctor->last_name) : 'Unknown',
                        'appointment_date' => $vital->appointment?->appointment_date,
                    ];
                }),
                'prescriptions' => $prescriptions->map(function($prescription) {
                    return [
                        'id' => $prescription->id,
                        'prescription_number' => $prescription->prescription_number,
                        'prescription_date' => $prescription->prescription_date,
                        'status' => $prescription->status,
                        'doctor' => $prescription->doctor ? ($prescription->doctor->first_name . ' ' . $prescription->doctor->last_name) : 'Unknown',
                        'pharmacist' => $prescription->pharmacist ? ($prescription->pharmacist->first_name . ' ' . $prescription->pharmacist->last_name) : null,
                        'dispensed_at' => $prescription->dispensed_at,
                        'instructions' => $prescription->instructions,
                        'notes' => $prescription->notes,
                        'items' => $prescription->items?->map(function($item) {
                            return [
                                'medication' => $item->inventoryItem?->name ?? 'Unknown',
                                'dosage' => $item->inventoryItem?->dosage,
                                'unit' => $item->inventoryItem?->unit,
                                'quantity' => $item->quantity,
                                'instructions' => $item->instructions,
                            ];
                        }) ?? [],
                    ];
                }),
            ],
            'generated_at' => now()->toDateTimeString(),
        ]);
    }

    public function generateBulkPatientReports(Request $request)
    {
        $validated = $request->validate([
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date',
            'department_id' => 'nullable|exists:departments,id',
            'patient_ids' => 'nullable|array',
            'patient_ids.*' => 'exists:users,id',
            'status' => 'nullable|in:active,inactive,all',
        ]);

        $startDate = $validated['start_date'] ?? null;
        $endDate = $validated['end_date'] ?? null;
        $departmentId = $validated['department_id'] ?? null;
        $patientIds = $validated['patient_ids'] ?? null;
        $status = $validated['status'] ?? 'active';

        $patientsQuery = User::role('patient')
            ->with(['patientProfile', 'clinic', 'department']);

        if ($departmentId) {
            $patientsQuery->where('department_id', $departmentId);
        }

        if ($patientIds) {
            $patientsQuery->whereIn('id', $patientIds);
        }

        if ($status !== 'all') {
            $patientsQuery->where('is_active', $status === 'active');
        }

        $patients = $patientsQuery->get();

        $reports = $patients->map(function($patient) use ($startDate, $endDate) {
            $dateFilter = function($query) use ($startDate, $endDate) {
                if ($startDate) {
                    $query->whereDate('created_at', '>=', $startDate);
                }
                if ($endDate) {
                    $query->whereDate('created_at', '<=', $endDate);
                }
            };

            $appointmentCount = Appointment::where('patient_id', $patient->id)
                ->when($startDate || $endDate, $dateFilter)
                ->count();

            $diagnosisCount = Diagnosis::where('patient_id', $patient->id)
                ->when($startDate || $endDate, $dateFilter)
                ->count();

            $prescriptionCount = Prescription::where('patient_id', $patient->id)
                ->when($startDate || $endDate, $dateFilter)
                ->count();

            $vitalSignCount = VitalSign::where('patient_id', $patient->id)
                ->when($startDate || $endDate, $dateFilter)
                ->count();

            $ehrCount = EhrRecord::where('patient_id', $patient->id)
                ->when($startDate || $endDate, $dateFilter)
                ->count();

            $latestAppointment = Appointment::where('patient_id', $patient->id)
                ->latest('appointment_date')
                ->first();

            $latestDiagnosis = Diagnosis::where('patient_id', $patient->id)
                ->latest('diagnosis_date')
                ->first();

            return [
                'patient_id' => $patient->id,
                'patient_name' => trim(($patient->first_name ?? '') . ' ' . ($patient->last_name ?? '')),
                'email' => $patient->email,
                'department' => $patient->department?->name ?? '-',
                'is_active' => $patient->is_active,
                'record_counts' => [
                    'appointments' => $appointmentCount,
                    'diagnoses' => $diagnosisCount,
                    'prescriptions' => $prescriptionCount,
                    'vital_signs' => $vitalSignCount,
                    'ehr_records' => $ehrCount,
                    'total_records' => $appointmentCount + $diagnosisCount + $prescriptionCount + $vitalSignCount + $ehrCount,
                ],
                'latest_activity' => [
                    'last_appointment' => $latestAppointment?->appointment_date,
                    'last_diagnosis' => $latestDiagnosis?->diagnosis_date,
                ],
            ];
        });

        $totalStats = [
            'total_patients' => $patients->count(),
            'active_patients' => $patients->where('is_active', true)->count(),
            'inactive_patients' => $patients->where('is_active', false)->count(),
            'total_appointments' => $reports->sum('record_counts.appointments'),
            'total_diagnoses' => $reports->sum('record_counts.diagnoses'),
            'total_prescriptions' => $reports->sum('record_counts.prescriptions'),
            'total_vital_signs' => $reports->sum('record_counts.vital_signs'),
            'total_ehr_records' => $reports->sum('record_counts.ehr_records'),
        ];

        return response()->json([
            'filters' => [
                'start_date' => $startDate,
                'end_date' => $endDate,
                'department_id' => $departmentId,
                'status' => $status,
            ],
            'summary_statistics' => $totalStats,
            'patient_reports' => $reports,
            'generated_at' => now()->toDateTimeString(),
        ]);
    }

    public function generateDepartmentPatientReport(Request $request)
    {
        $validated = $request->validate([
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date',
        ]);

        $startDate = $validated['start_date'] ?? null;
        $endDate = $validated['end_date'] ?? null;

        $departments = Department::with('doctors')
            ->withCount([
                'users as patient_count' => function($query) {
                    $query->role('patient');
                }
            ])
            ->get();

        $departmentReports = $departments->map(function($department) use ($startDate, $endDate) {
            $dateFilter = function($query) use ($startDate, $endDate) {
                if ($startDate) {
                    $query->whereDate('created_at', '>=', $startDate);
                }
                if ($endDate) {
                    $query->whereDate('created_at', '<=', $endDate);
                }
            };

            $patientIds = User::role('patient')
                ->where('department_id', $department->id)
                ->pluck('id');

            $stats = [
                'total_patients' => $patientIds->count(),
                'appointments' => Appointment::whereIn('patient_id', $patientIds)
                    ->when($startDate || $endDate, $dateFilter)
                    ->count(),
                'diagnoses' => Diagnosis::whereIn('patient_id', $patientIds)
                    ->when($startDate || $endDate, $dateFilter)
                    ->count(),
                'prescriptions' => Prescription::whereIn('patient_id', $patientIds)
                    ->when($startDate || $endDate, $dateFilter)
                    ->count(),
            ];

            return [
                'department_id' => $department->id,
                'department_name' => $department->name,
                'description' => $department->description,
                'status' => $department->status,
                'doctor_count' => $department->doctors->count(),
                'statistics' => $stats,
            ];
        });

        return response()->json([
            'filters' => [
                'start_date' => $startDate,
                'end_date' => $endDate,
            ],
            'department_reports' => $departmentReports,
            'generated_at' => now()->toDateTimeString(),
        ]);
    }
}
