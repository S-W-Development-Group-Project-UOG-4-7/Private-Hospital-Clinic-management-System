<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Appointment;
use App\Models\Department;
use App\Models\EhrRecord;
use App\Models\Diagnosis;
use App\Models\VitalSign;
use App\Models\Prescription;
use App\Models\InventoryItem;
use App\Models\StockLedger;
use App\Models\Payment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Carbon\Carbon;

class AdminController extends Controller
{
    // ==========================================
    // 1. USER MANAGEMENT
    // ==========================================

    public function getUsers()
    {
        $query = User::with(['roles', 'department'])->latest();
        $perPage = request()->integer('per_page');
        $paginate = request()->boolean('paginate', false) || $perPage;

        $transform = function ($user) {
            return [
                'id' => $user->id,
                'name' => trim(($user->first_name ?? '') . ' ' . ($user->last_name ?? '')),
                'username' => $user->username,
                'email' => $user->email,
                'role' => $user->roles->first()->name ?? 'patient',
                'department' => $user->department->name ?? '-',
                'is_active' => $user->is_active,
                'created_at' => $user->created_at->format('Y-m-d'),
            ];
        };

        if ($paginate) {
            $users = $query->paginate($perPage ?: 25);
            $users->getCollection()->transform($transform);
            return response()->json($users);
        }

        $users = $query->get()->map($transform);
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

        $this->setAuditContext(
            $request,
            'user',
            $user->id,
            null,
            $user->toArray()
        );

        return response()->json(['message' => 'User created successfully', 'user' => $user]);
    }

    public function updateUser(Request $request, $id)
    {
        $user = User::findOrFail($id);
        $before = $user->toArray();

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

        $this->setAuditContext(
            $request,
            'user',
            $user->id,
            $before,
            $user->fresh()->toArray()
        );

        return response()->json(['message' => 'User updated successfully']);
    }

    public function toggleUserStatus(Request $request, $id)
    {
        $user = User::findOrFail($id);
        $before = $user->toArray();

        $currentUser = Auth::user();
        if ($currentUser && $user->id === $currentUser->id) {
            return response()->json(['message' => 'You cannot deactivate your own account.'], 403);
        }

        $user->is_active = !$user->is_active;
        $user->save();

        $this->setAuditContext(
            $request,
            'user',
            $user->id,
            $before,
            $user->fresh()->toArray()
        );

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
        $performance = Appointment::where('status', Appointment::STATUS_COMPLETED)
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
        $inventory = InventoryItem::select('id', 'name', 'quantity', 'expiry_date', 'reorder_level')
            ->orderBy('quantity', 'asc')
            ->get()
            ->map(function($item) {
                $threshold = $item->reorder_level ?? 10;
                return [
                    'id' => $item->id,
                    'name' => $item->name,
                    'stock' => $item->quantity,
                    'status' => $item->quantity <= $threshold ? 'Low Stock' : 'In Stock',
                    'expiry' => optional($item->expiry_date)->format('Y-m-d'),
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
            'reorder_level' => 'nullable|integer|min:0',
            'unit_price' => 'nullable|numeric|min:0',
            'selling_price' => 'nullable|numeric|min:0',
        ]);

        $item = InventoryItem::create([
            'name' => $validated['name'],
            'quantity' => $validated['stock_quantity'],
            'expiry_date' => $validated['expiry_date'],
            'reorder_level' => $validated['reorder_level'] ?? 10,
            'unit_price' => $validated['unit_price'] ?? 0,
            'selling_price' => $validated['selling_price'] ?? 0,
            'is_active' => true,
        ]);

        $this->setAuditContext($request, 'inventory_item', $item->id, null, $item->toArray());
        return response()->json(['message' => 'Medicine added successfully', 'drug' => $item]);
    }

    public function updateDrug(Request $request, $id)
    {
        $item = InventoryItem::findOrFail($id);
        $before = $item->toArray();
        $validated = $request->validate([
            'name' => 'required|string',
            'stock_quantity' => 'required|integer|min:0',
            'expiry_date' => 'required|date',
            'reorder_level' => 'nullable|integer|min:0',
            'unit_price' => 'nullable|numeric|min:0',
            'selling_price' => 'nullable|numeric|min:0',
        ]);

        $item->update([
            'name' => $validated['name'],
            'quantity' => $validated['stock_quantity'],
            'expiry_date' => $validated['expiry_date'],
            'reorder_level' => $validated['reorder_level'] ?? $item->reorder_level,
            'unit_price' => $validated['unit_price'] ?? $item->unit_price,
            'selling_price' => $validated['selling_price'] ?? $item->selling_price,
        ]);
        $this->setAuditContext($request, 'inventory_item', $item->id, $before, $item->fresh()->toArray());
        return response()->json(['message' => 'Medicine updated successfully', 'drug' => $item]);
    }

    public function deleteDrug(Request $request, $id)
    {
        $item = InventoryItem::findOrFail($id);
        $before = $item->toArray();
        $item->delete();
        $this->setAuditContext($request, 'inventory_item', $id, $before, null);
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
        $this->setAuditContext($request, 'department', $dept->id, null, $dept->toArray());
        return response()->json(['message' => 'Department created', 'department' => $dept]);
    }

    public function updateDepartment(Request $request, $id)
    {
        $dept = Department::findOrFail($id);
        $before = $dept->toArray();
        $validated = $request->validate([
            'name' => 'required|string|unique:departments,name,' . $id,
            'description' => 'nullable|string',
            'status' => 'required|string|in:Active,Inactive'
        ]);

        $dept->update($validated);
        $this->setAuditContext($request, 'department', $dept->id, $before, $dept->fresh()->toArray());
        return response()->json(['message' => 'Department updated', 'department' => $dept]);
    }

    public function deleteDepartment(Request $request, $id)
    {
        $dept = Department::findOrFail($id);
        $before = $dept->toArray();
        if ($dept->doctors()->exists()) {
             return response()->json(['message' => 'Cannot delete department with assigned doctors.'], 400);
        }
        $dept->delete();
        $this->setAuditContext($request, 'department', $id, $before, null);
        return response()->json(['message' => 'Department deleted']);
    }

    // ==========================================
    // 5. APPOINTMENT MANAGEMENT
    // ==========================================

    public function getAppointments()
    {
        $query = Appointment::with(['patient', 'doctor', 'department'])
            ->orderBy('appointment_date', 'desc');
        $perPage = request()->integer('per_page');
        $paginate = request()->boolean('paginate', false) || $perPage;

        $transform = function ($appt) {
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
        };

        if ($paginate) {
            $appointments = $query->paginate($perPage ?: 25);
            $appointments->getCollection()->transform($transform);
            return response()->json($appointments);
        }

        $formatted = $query->get()->map($transform);
        return response()->json($formatted);
    }

    public function updateAppointment(Request $request, $id)
    {
        $appointment = Appointment::findOrFail($id);
        $before = $appointment->toArray();

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

        $this->setAuditContext($request, 'appointment', $appointment->id, $before, $appointment->fresh()->toArray());

        return response()->json([
            'message' => 'Appointment updated successfully',
            'appointment' => $appointment->fresh(['doctor', 'department', 'patient'])
        ]);
    }

    public function deleteAppointment(Request $request, $id)
    {
        $appointment = Appointment::findOrFail($id);
        $before = $appointment->toArray();
        $appointment->delete();
        $this->setAuditContext($request, 'appointment', $id, $before, null);
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
            'completed_appointments' => $appointments->where('status', Appointment::STATUS_COMPLETED)->count(),
            'cancelled_appointments' => $appointments->where('status', Appointment::STATUS_CANCELLED)->count(),
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

    // ==========================================
    // 7. ADMIN REPORTING (CSV SUPPORT)
    // ==========================================

    public function reportAppointments(Request $request)
    {
        $validated = $request->validate([
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date',
            'group_by' => 'nullable|in:day,department,doctor',
            'format' => 'nullable|in:json,csv',
        ]);

        $groupBy = $validated['group_by'] ?? 'day';
        $startDate = $validated['start_date'] ?? null;
        $endDate = $validated['end_date'] ?? null;

        $base = Appointment::query()
            ->when($startDate, fn ($q) => $q->whereDate('appointment_date', '>=', $startDate))
            ->when($endDate, fn ($q) => $q->whereDate('appointment_date', '<=', $endDate));

        if ($groupBy === 'department') {
            $rows = $base->leftJoin('departments', 'appointments.department_id', '=', 'departments.id')
                ->selectRaw('departments.id as department_id, departments.name as department_name')
                ->selectRaw('count(*) as total')
                ->selectRaw("sum(case when appointments.status = ? then 1 else 0 end) as completed", [Appointment::STATUS_COMPLETED])
                ->selectRaw("sum(case when appointments.status = ? then 1 else 0 end) as cancelled", [Appointment::STATUS_CANCELLED])
                ->selectRaw("sum(case when appointments.status = ? then 1 else 0 end) as no_show", [Appointment::STATUS_NO_SHOW])
                ->groupBy('departments.id', 'departments.name')
                ->orderByDesc('total')
                ->get();
        } elseif ($groupBy === 'doctor') {
            $rows = $base->leftJoin('users as doctors', 'appointments.doctor_id', '=', 'doctors.id')
                ->selectRaw('doctors.id as doctor_id')
                ->selectRaw("trim(coalesce(doctors.first_name, '') || ' ' || coalesce(doctors.last_name, '')) as doctor_name")
                ->selectRaw('count(*) as total')
                ->selectRaw("sum(case when appointments.status = ? then 1 else 0 end) as completed", [Appointment::STATUS_COMPLETED])
                ->selectRaw("sum(case when appointments.status = ? then 1 else 0 end) as cancelled", [Appointment::STATUS_CANCELLED])
                ->selectRaw("sum(case when appointments.status = ? then 1 else 0 end) as no_show", [Appointment::STATUS_NO_SHOW])
                ->groupBy('doctors.id', 'doctors.first_name', 'doctors.last_name')
                ->orderByDesc('total')
                ->get();
        } else {
            $rows = $base->selectRaw('date(appointment_date) as day')
                ->selectRaw('count(*) as total')
                ->selectRaw("sum(case when status = ? then 1 else 0 end) as completed", [Appointment::STATUS_COMPLETED])
                ->selectRaw("sum(case when status = ? then 1 else 0 end) as cancelled", [Appointment::STATUS_CANCELLED])
                ->selectRaw("sum(case when status = ? then 1 else 0 end) as no_show", [Appointment::STATUS_NO_SHOW])
                ->groupBy('day')
                ->orderBy('day')
                ->get();
        }

        if (($validated['format'] ?? 'json') === 'csv') {
            return $this->streamCsv('appointments_report.csv', $rows->toArray());
        }

        return response()->json([
            'filters' => [
                'start_date' => $startDate,
                'end_date' => $endDate,
                'group_by' => $groupBy,
            ],
            'data' => $rows,
            'generated_at' => now()->toDateTimeString(),
        ]);
    }

    public function reportRevenue(Request $request)
    {
        $validated = $request->validate([
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date',
            'group_by' => 'nullable|in:day,month',
            'format' => 'nullable|in:json,csv',
        ]);

        $groupBy = $validated['group_by'] ?? 'day';
        $startDate = $validated['start_date'] ?? null;
        $endDate = $validated['end_date'] ?? null;

        $dateExpression = $groupBy === 'month' ? "to_char(date(coalesce(paid_at, created_at)), 'YYYY-MM')" : 'date(coalesce(paid_at, created_at))';

        $rows = Payment::query()
            ->where('status', 'paid')
            ->when($startDate, fn ($q) => $q->whereDate(DB::raw('coalesce(paid_at, created_at)'), '>=', $startDate))
            ->when($endDate, fn ($q) => $q->whereDate(DB::raw('coalesce(paid_at, created_at)'), '<=', $endDate))
            ->selectRaw("$dateExpression as period")
            ->selectRaw('count(*) as payments')
            ->selectRaw('sum(amount) as revenue')
            ->groupBy('period')
            ->orderBy('period')
            ->get();

        if (($validated['format'] ?? 'json') === 'csv') {
            return $this->streamCsv('revenue_report.csv', $rows->toArray());
        }

        return response()->json([
            'filters' => [
                'start_date' => $startDate,
                'end_date' => $endDate,
                'group_by' => $groupBy,
            ],
            'data' => $rows,
            'generated_at' => now()->toDateTimeString(),
        ]);
    }

    public function reportNoShowRates(Request $request)
    {
        $validated = $request->validate([
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date',
            'group_by' => 'nullable|in:day,department,doctor',
            'format' => 'nullable|in:json,csv',
        ]);

        $groupBy = $validated['group_by'] ?? 'day';
        $startDate = $validated['start_date'] ?? null;
        $endDate = $validated['end_date'] ?? null;

        $base = Appointment::query()
            ->when($startDate, fn ($q) => $q->whereDate('appointment_date', '>=', $startDate))
            ->when($endDate, fn ($q) => $q->whereDate('appointment_date', '<=', $endDate));

        if ($groupBy === 'department') {
            $rows = $base->leftJoin('departments', 'appointments.department_id', '=', 'departments.id')
                ->selectRaw('departments.id as department_id, departments.name as department_name')
                ->selectRaw('count(*) as total')
                ->selectRaw("sum(case when appointments.status = ? then 1 else 0 end) as no_show", [Appointment::STATUS_NO_SHOW])
                ->groupBy('departments.id', 'departments.name')
                ->orderByDesc('no_show')
                ->get()
                ->map(function ($row) {
                    $row->rate = $row->total > 0 ? round(($row->no_show / $row->total) * 100, 2) : 0;
                    return $row;
                });
        } elseif ($groupBy === 'doctor') {
            $rows = $base->leftJoin('users as doctors', 'appointments.doctor_id', '=', 'doctors.id')
                ->selectRaw('doctors.id as doctor_id')
                ->selectRaw("trim(coalesce(doctors.first_name, '') || ' ' || coalesce(doctors.last_name, '')) as doctor_name")
                ->selectRaw('count(*) as total')
                ->selectRaw("sum(case when appointments.status = ? then 1 else 0 end) as no_show", [Appointment::STATUS_NO_SHOW])
                ->groupBy('doctors.id', 'doctors.first_name', 'doctors.last_name')
                ->orderByDesc('no_show')
                ->get()
                ->map(function ($row) {
                    $row->rate = $row->total > 0 ? round(($row->no_show / $row->total) * 100, 2) : 0;
                    return $row;
                });
        } else {
            $rows = $base->selectRaw('date(appointment_date) as day')
                ->selectRaw('count(*) as total')
                ->selectRaw("sum(case when status = ? then 1 else 0 end) as no_show", [Appointment::STATUS_NO_SHOW])
                ->groupBy('day')
                ->orderBy('day')
                ->get()
                ->map(function ($row) {
                    $row->rate = $row->total > 0 ? round(($row->no_show / $row->total) * 100, 2) : 0;
                    return $row;
                });
        }

        if (($validated['format'] ?? 'json') === 'csv') {
            return $this->streamCsv('no_show_report.csv', $rows->toArray());
        }

        return response()->json([
            'filters' => [
                'start_date' => $startDate,
                'end_date' => $endDate,
                'group_by' => $groupBy,
            ],
            'data' => $rows,
            'generated_at' => now()->toDateTimeString(),
        ]);
    }

    public function reportInventoryValuation(Request $request)
    {
        $validated = $request->validate([
            'include_inactive' => 'nullable|boolean',
            'format' => 'nullable|in:json,csv',
        ]);

        $includeInactive = (bool) ($validated['include_inactive'] ?? false);

        $items = InventoryItem::query()
            ->when(!$includeInactive, fn ($q) => $q->where('is_active', true))
            ->orderBy('name')
            ->get()
            ->map(function (InventoryItem $item) {
                $costValue = (float) $item->unit_price * (int) $item->quantity;
                $sellValue = (float) $item->selling_price * (int) $item->quantity;

                return [
                    'id' => $item->id,
                    'name' => $item->name,
                    'quantity' => $item->quantity,
                    'unit_price' => $item->unit_price,
                    'selling_price' => $item->selling_price,
                    'cost_value' => round($costValue, 2),
                    'sell_value' => round($sellValue, 2),
                    'is_active' => $item->is_active,
                    'expiry_date' => $item->expiry_date?->format('Y-m-d'),
                ];
            });

        if (($validated['format'] ?? 'json') === 'csv') {
            return $this->streamCsv('inventory_valuation.csv', $items->toArray());
        }

        return response()->json([
            'summary' => [
                'total_cost_value' => round($items->sum('cost_value'), 2),
                'total_sell_value' => round($items->sum('sell_value'), 2),
                'items' => $items->count(),
            ],
            'data' => $items,
            'generated_at' => now()->toDateTimeString(),
        ]);
    }

    public function reportStockMovement(Request $request)
    {
        $validated = $request->validate([
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date',
            'type' => 'nullable|in:PURCHASE,DISPENSE,ADJUST',
            'format' => 'nullable|in:json,csv',
        ]);

        $startDate = $validated['start_date'] ?? null;
        $endDate = $validated['end_date'] ?? null;
        $type = $validated['type'] ?? null;

        $rows = StockLedger::query()
            ->with(['inventoryItem', 'performer'])
            ->when($type, fn ($q) => $q->where('type', $type))
            ->when($startDate, fn ($q) => $q->whereDate('created_at', '>=', $startDate))
            ->when($endDate, fn ($q) => $q->whereDate('created_at', '<=', $endDate))
            ->orderByDesc('created_at')
            ->get()
            ->map(function (StockLedger $ledger) {
                return [
                    'id' => $ledger->id,
                    'item' => $ledger->inventoryItem?->name,
                    'type' => $ledger->type,
                    'quantity' => $ledger->quantity,
                    'cost_price' => $ledger->cost_price,
                    'sell_price' => $ledger->sell_price,
                    'performed_by' => $ledger->performer?->name,
                    'reason' => $ledger->reason,
                    'created_at' => $ledger->created_at?->toDateTimeString(),
                ];
            });

        if (($validated['format'] ?? 'json') === 'csv') {
            return $this->streamCsv('stock_movement.csv', $rows->toArray());
        }

        return response()->json([
            'filters' => [
                'start_date' => $startDate,
                'end_date' => $endDate,
                'type' => $type,
            ],
            'data' => $rows,
            'generated_at' => now()->toDateTimeString(),
        ]);
    }

    private function setAuditContext(Request $request, string $entityType, ?int $entityId, ?array $before, ?array $after): void
    {
        $request->attributes->set('audit.entity_type', $entityType);
        $request->attributes->set('audit.entity_id', $entityId);
        $request->attributes->set('audit.before', $before);
        $request->attributes->set('audit.after', $after);
    }

    private function streamCsv(string $filename, array $rows): StreamedResponse
    {
        $headers = [];
        if (!empty($rows)) {
            $headers = array_keys((array) $rows[0]);
        }

        return response()->streamDownload(function () use ($rows, $headers): void {
            $handle = fopen('php://output', 'w');
            if ($headers) {
                fputcsv($handle, $headers);
            }
            foreach ($rows as $row) {
                fputcsv($handle, array_values((array) $row));
            }
            fclose($handle);
        }, $filename, [
            'Content-Type' => 'text/csv',
        ]);
    }
}
