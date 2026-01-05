<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PatientProfile;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Spatie\Permission\Models\Role as SpatieRole;

class ReceptionistPatientController extends Controller
{
    public function index(Request $request)
    {
        $query = User::query()
            ->role('patient')
            ->with(['patientProfile']);

        if ($request->has('search')) {
            $search = trim((string) $request->get('search'));
            if ($search !== '') {
                $query->where(function ($q) use ($search) {
                    $q->where('first_name', 'like', "%{$search}%")
                        ->orWhere('last_name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhere('username', 'like', "%{$search}%");
                });
            }
        }

        if ($request->has('is_active')) {
            $query->where('is_active', (bool) $request->boolean('is_active'));
        }

        $patients = $query
            ->orderBy('first_name')
            ->orderBy('last_name')
            ->paginate((int) ($request->get('per_page') ?: 20));

        return response()->json($patients);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'first_name' => ['required', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'phone' => ['required', 'string', 'max:50'],
            'age' => ['required', 'integer', 'min:0', 'max:150'],
        ]);

        // Auto-generate username from name
        $usernameBase = Str::slug($validated['first_name'] . ' ' . $validated['last_name'], '');
        $usernameBase = $usernameBase !== '' ? $usernameBase : 'patient';
        $candidate = $usernameBase;
        $suffix = 1;
        while (User::where('username', $candidate)->exists()) {
            $candidate = $usernameBase . $suffix;
            $suffix++;
        }
        $username = $candidate;

        // Auto-generate email from phone number or username
        $emailBase = 'patient.' . $username . '@mediclinic.local';
        $emailCandidate = $emailBase;
        $emailSuffix = 1;
        while (User::where('email', $emailCandidate)->exists()) {
            $emailCandidate = 'patient.' . $username . $emailSuffix . '@mediclinic.local';
            $emailSuffix++;
        }
        $email = $emailCandidate;

        // Auto-generate a default password
        $defaultPassword = 'Patient@' . date('Y');

        $patient = User::create([
            'first_name' => $validated['first_name'],
            'last_name' => $validated['last_name'],
            'username' => $username,
            'email' => $email,
            'password' => Hash::make($defaultPassword),
            'is_active' => true,
        ]);

        SpatieRole::findOrCreate('patient', 'sanctum');
        $patient->assignRole('patient');

        // Generate patient ID starting from 001
        $driver = DB::connection()->getDriverName();
        $lastPatientQuery = PatientProfile::query()
            ->whereNotNull('patient_id');

        if ($driver === 'pgsql') {
            $lastPatientQuery
                ->whereRaw("patient_id ~ '^[0-9]+$'")
                ->orderByRaw('patient_id::int DESC');
        } else {
            $lastPatientQuery->orderByRaw('CAST(patient_id AS UNSIGNED) DESC');
        }

        $lastPatient = $lastPatientQuery->first();
        $nextPatientId = 1;
        if ($lastPatient && $lastPatient->patient_id) {
            $lastId = (int) $lastPatient->patient_id;
            $nextPatientId = $lastId + 1;
        }
        $patientId = str_pad($nextPatientId, 3, '0', STR_PAD_LEFT);

        PatientProfile::updateOrCreate(
            ['user_id' => $patient->id],
            [
                'patient_id' => $patientId,
                'phone' => $validated['phone'],
                'age' => $validated['age'],
            ]
        );

        return response()->json($patient->load('patientProfile'), 201);
    }

    public function show(int $id)
    {
        $patient = User::query()
            ->role('patient')
            ->with('patientProfile')
            ->findOrFail($id);

        return response()->json($patient);
    }

    public function update(Request $request, int $id)
    {
        $patient = User::query()
            ->role('patient')
            ->with('patientProfile')
            ->findOrFail($id);

        $validated = $request->validate([
            'first_name' => ['sometimes', 'string', 'max:255'],
            'last_name' => ['sometimes', 'string', 'max:255'],
            'phone' => ['sometimes', 'string', 'max:50'],
            'age' => ['sometimes', 'integer', 'min:0', 'max:150'],
        ]);

        $patient->fill(collect($validated)->only([
            'first_name',
            'last_name',
        ])->toArray());

        $patient->save();

        if (
            array_key_exists('phone', $validated) ||
            array_key_exists('age', $validated)
        ) {
            PatientProfile::updateOrCreate(
                ['user_id' => $patient->id],
                [
                    'phone' => $validated['phone'] ?? $patient->patientProfile?->phone,
                    'age' => $validated['age'] ?? $patient->patientProfile?->age,
                ]
            );
        }

        return response()->json($patient->fresh()->load('patientProfile'));
    }

    public function destroy(int $id)
    {
        $patient = User::query()
            ->role('patient')
            ->findOrFail($id);

        $patient->is_active = false;
        $patient->save();

        return response()->json([
            'message' => 'Patient deactivated successfully',
        ]);
    }
}
