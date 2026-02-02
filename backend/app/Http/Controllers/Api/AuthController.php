<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\PatientProfile;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\Schema;
use Spatie\Permission\Models\Role as SpatieRole;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        // Now using Log::info cleanly
        Log::info('Registration attempt', $request->all());

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8'],
            'role' => ['nullable', 'string', Rule::in(['patient'])],
            'date_of_birth' => ['nullable', 'date'],
            'phone' => ['nullable', 'string', 'max:20'],
            'gender' => ['nullable', 'string', 'in:male,female,other'],
            'blood_type' => ['nullable', 'string', 'in:A+,A-,B+,B-,AB+,AB-,O+,O-'],
            'address' => ['nullable', 'string', 'max:255'],
            'city' => ['nullable', 'string', 'max:100'],
            'state' => ['nullable', 'string', 'max:100'],
            'postal_code' => ['nullable', 'string', 'max:20'],
            'guardian_name' => ['nullable', 'string', 'max:255'],
            'guardian_email' => ['nullable', 'email', 'max:255'],
            'guardian_phone' => ['nullable', 'string', 'max:20'],
            'guardian_relationship' => ['nullable', 'string', 'max:100'],
        ]);

        // Public signup is patient-only
        $roleName = 'patient';

        $fullName = trim($data['name']);
        $parts = preg_split('/\s+/', $fullName) ?: [];
        $firstName = $parts[0] ?? $fullName;
        $lastName = count($parts) > 1 ? trim(implode(' ', array_slice($parts, 1))) : 'Patient';

        $usernameBase = Str::slug($firstName . ' ' . $lastName, '');
        if ($usernameBase === '') {
            $usernameBase = 'user';
        }
        $username = $usernameBase;
        $suffix = 1;
        while (User::where('username', $username)->exists()) {
            $username = $usernameBase . $suffix;
            $suffix++;
        }

        // Build user data depending on whether a "name" column exists
        $userData = [
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
        ];

        if (Schema::hasColumn('users', 'name')) {
            $userData['name'] = $fullName;
        } else {
            $userData['first_name'] = $firstName;
            $userData['last_name'] = $lastName ?: 'Patient';
            $userData['username'] = $username;
        }

        $user = User::create($userData);

        // Create patient profile with additional information
        PatientProfile::create([
            'user_id' => $user->id,
            'phone' => $data['phone'] ?? null,
            'date_of_birth' => $data['date_of_birth'] ?? null,
            'gender' => $data['gender'] ?? null,
            'address' => $data['address'] ?? null,
            'blood_type' => $data['blood_type'] ?? null,
            'city' => $data['city'] ?? null,
            'state' => $data['state'] ?? null,
            'postal_code' => $data['postal_code'] ?? null,
            'guardian_name' => $data['guardian_name'] ?? null,
            'guardian_email' => $data['guardian_email'] ?? null,
            'guardian_phone' => $data['guardian_phone'] ?? null,
            'guardian_relationship' => $data['guardian_relationship'] ?? null,
        ]);

        // Assign role using Spatie Permission (and create if missing)
        SpatieRole::findOrCreate($roleName, 'sanctum');
        $user->assignRole($roleName);

        $token = $user->createToken('auth_token')->plainTextToken;

        Log::info('Registration successful for user', ['id' => $user->id, 'email' => $user->email]);

        return response()->json([
            'message' => 'Registration successful.',
            'token' => $token,
            'user' => $this->formatUserData($user),
        ], 201);
    }

    public function login(Request $request)
    {
        try {
            $credentials = $request->validate([
                'login' => ['required', 'string'], // email
                'password' => ['required', 'string'],
            ]);

            // Search by email only
            $user = User::where('email', $credentials['login'])->first();

            if (! $user || ! Hash::check($credentials['password'], $user->password)) {
                throw ValidationException::withMessages([
                    'login' => ['The provided credentials are incorrect.'],
                ]);
            }

            $user->tokens()->delete();
            $token = $user->createToken('auth_token')->plainTextToken;

            Log::debug('AuthController@login success', [
                'user_id' => $user->id,
            ]);

            return response()->json([
                'message' => 'Login successful.',
                'token' => $token,
                'user' => $this->formatUserData($user),
            ]);
        } catch (\Throwable $e) {
            Log::error('AuthController@login error', [
                'login' => $request->input('login'),
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            throw $e;
        }
    }

    public function logout(Request $request)
    {
        $request->user()?->tokens()->delete();

        return response()->json([
            'message' => 'Logged out successfully.',
        ]);
    }

    public function me(Request $request)
    {
        $user = $request->user();

        return response()->json([
            'user' => $this->formatUserData($user),
        ]);
    }

    /**
     * Helper to format user data consistently.
     * Checks both 'legacyRole' relation and Spatie roles to find the correct role name.
     */
    private function formatUserData($user)
    {
        // FIX: Load 'legacyRole' instead of 'role' (which is now a scope)
        $user->load('legacyRole');

        // Determine role: Check role_id relation first, then Spatie, then default to patient
        $roleName = 'patient';

        // FIX: Check 'legacyRole' property
        if ($user->legacyRole) {
            $roleName = $user->legacyRole->name;
        } elseif ($user->roles && $user->roles->first()) {
            $roleName = $user->roles->first()->name;
        }

        return [
            'id' => $user->id,
            'first_name' => $user->first_name ?? $user->name,
            'last_name' => $user->last_name ?? '',
            'name' => $user->name ?? ($user->first_name . ' ' . $user->last_name),
            'username' => $user->username,
            'email' => $user->email,
            'role' => $roleName, // This now returns a String (e.g., "admin"), not a number
        ];
    }
}
