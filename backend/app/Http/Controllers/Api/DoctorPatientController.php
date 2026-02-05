<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\PatientProfile;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;
use Spatie\Permission\Models\Role as SpatieRole;

class DoctorPatientController extends Controller
{
    public function index(Request $request)
    {
        // Get patients - doctors can view all patients
        $query = User::with('patientProfile')
            ->whereHas('roles', function($q) {
                $q->where('name', 'patient');
            });

        // Optional search by name or phone
        if ($request->has('search')) {
            $search = trim((string) $request->get('search'));
            if ($search !== '') {
                $query->where(function($q) use ($search) {
                    $q->where('first_name', 'like', "%{$search}%")
                      ->orWhere('last_name', 'like', "%{$search}%")
                      ->orWhere('username', 'like', "%{$search}%")
                      ->orWhere('email', 'like', "%{$search}%")
                      ->orWhereHas('patientProfile', function($subQ) use ($search) {
                          $subQ->where('phone', 'like', "%{$search}%");
                      });
                });
            }
        }

        $limit = (int) ($request->get('limit') ?? 50);
        $limit = $limit > 0 ? min($limit, 200) : 50;
        $patients = $query->latest()->limit($limit)->get();

        return response()->json([
            'success' => true,
            'data' => $patients,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['nullable', 'string', 'min:8'],
            'date_of_birth' => ['nullable', 'date'],
            'age' => ['nullable', 'integer', 'min:0', 'max:150'],
            'phone' => ['nullable', 'string', 'max:50'],
            'gender' => ['nullable', 'string', 'in:male,female,other'],
            'blood_type' => ['nullable', 'string', 'in:A+,A-,B+,B-,AB+,AB-,O+,O-'],
            'address' => ['nullable', 'string', 'max:1000'],
            'city' => ['nullable', 'string', 'max:255'],
            'state' => ['nullable', 'string', 'max:255'],
            'postal_code' => ['nullable', 'string', 'max:50'],
            'guardian_name' => ['nullable', 'string', 'max:255'],
            'guardian_email' => ['nullable', 'email', 'max:255'],
            'guardian_phone' => ['nullable', 'string', 'max:50'],
            'guardian_relationship' => ['nullable', 'string', 'max:100'],
        ]);

        // Build name / first/last mapping similar to other registration flows
        $fullName = trim($validated['name']);
        $parts = preg_split('/\s+/', $fullName) ?: [];
        $firstName = $parts[0] ?? $fullName;
        $lastName = count($parts) > 1 ? trim(implode(' ', array_slice($parts, 1))) : '';

        $username = null;
        if (Schema::hasColumn('users', 'username')) {
            $usernameBase = Str::slug($firstName . ' ' . $lastName, '');
            if ($usernameBase === '') {
                $usernameBase = explode('@', $validated['email'])[0] ?? 'user';
            }
            $username = $usernameBase;
            $suffix = 1;
            while (User::where('username', $username)->exists()) {
                $username = $usernameBase . $suffix;
                $suffix++;
            }
        }

        $generatedPassword = null;
        $password = $validated['password'] ?? null;
        if (! $password) {
            $generatedPassword = Str::random(12);
            $password = $generatedPassword;
        }

        $userData = [
            'email' => $validated['email'],
            'password' => Hash::make($password),
        ];

        if (Schema::hasColumn('users', 'first_name')) {
            $userData['first_name'] = $firstName;
        }
        if (Schema::hasColumn('users', 'last_name')) {
            $userData['last_name'] = $lastName ?: 'Patient';
        }
        if ($username !== null) {
            $userData['username'] = $username;
        }
        if (Schema::hasColumn('users', 'phone')) {
            $userData['phone'] = $validated['phone'] ?? null;
        }
        if (Schema::hasColumn('users', 'is_active')) {
            $userData['is_active'] = true;
        }

        $createdUser = null;

        DB::transaction(function () use (&$createdUser, $userData, $validated, $fullName) {
            $createdUser = User::create($userData);
            if (Schema::hasColumn('users', 'name')) {
                $createdUser->forceFill(['name' => $fullName])->save();
            }

            $guardName = config('auth.defaults.guard', 'web');
            SpatieRole::findOrCreate('patient', $guardName);
            $createdUser->assignRole('patient');

            $driver = DB::connection()->getDriverName();
            $lastPatientQuery = PatientProfile::query()->whereNotNull('patient_id');

            if ($driver === 'pgsql') {
                $lastPatientQuery
                    ->whereRaw("patient_id ~ '^[0-9]+$")
                    ->orderByRaw('patient_id::int DESC');
            } else {
                $lastPatientQuery->orderByRaw('CAST(patient_id AS UNSIGNED) DESC');
            }

            $lastPatient = $lastPatientQuery->lockForUpdate()->first();
            $nextPatientId = $lastPatient && $lastPatient->patient_id
                ? ((int) $lastPatient->patient_id) + 1
                : 1;

            $patientId = str_pad((string) $nextPatientId, 3, '0', STR_PAD_LEFT);

            $age = null;
            if (array_key_exists('age', $validated)) {
                $age = $validated['age'];
            } elseif (! empty($validated['date_of_birth'])) {
                $age = Carbon::parse($validated['date_of_birth'])->age;
            }

            $profileData = array_filter([
                'patient_id' => $patientId,
                'phone' => $validated['phone'] ?? null,
                'age' => $age,
                'date_of_birth' => $validated['date_of_birth'] ?? null,
                'gender' => $validated['gender'] ?? null,
                'address' => $validated['address'] ?? null,
                'blood_type' => $validated['blood_type'] ?? null,
                'city' => $validated['city'] ?? null,
                'state' => $validated['state'] ?? null,
                'postal_code' => $validated['postal_code'] ?? null,
                'guardian_name' => $validated['guardian_name'] ?? null,
                'guardian_email' => $validated['guardian_email'] ?? null,
                'guardian_phone' => $validated['guardian_phone'] ?? null,
                'guardian_relationship' => $validated['guardian_relationship'] ?? null,
            ], static fn ($value) => $value !== null);

            PatientProfile::updateOrCreate(
                ['user_id' => $createdUser->id],
                $profileData
            );
        });

        $createdUser = $createdUser?->fresh(['patientProfile']);
        if ($createdUser) {
            $createdUser->makeHidden(['password']);
        }

        return response()->json([
            'user' => $createdUser,
            'generated_password' => $generatedPassword,
        ], 201);
    }
}
