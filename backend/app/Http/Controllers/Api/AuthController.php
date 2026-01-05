<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PatientProfile;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Spatie\Permission\Models\Role as SpatieRole;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        \Log::info('Registration attempt', $request->all());
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
        while (\App\Models\User::where('username', $username)->exists()) {
            $username = $usernameBase . $suffix;
            $suffix++;
        }

        $user = User::create([
            'name' => $fullName,
            'first_name' => $firstName,
            'last_name' => $lastName,
            'username' => $username,
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
        ]);

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

        // Assign role using Spatie Permission
        SpatieRole::findOrCreate($roleName, 'sanctum');
        $user->assignRole($roleName);

        $token = $user->createToken('auth_token')->plainTextToken;

        // Get the user's role name
        $userRole = $user->roles->first()?->name ?? 'patient';

        \Log::info('Registration successful for user', ['id' => $user->id, 'email' => $user->email]);

        return response()->json([
            'message' => 'Registration successful.',
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $userRole,
            ],
        ], 201);
    }

    public function login(Request $request)
    {
        $credentials = $request->validate([
            'login' => ['required', 'string'], // email
            'password' => ['required', 'string'],
        ]);

        // Since we only have email now, search by email only
        $user = \App\Models\User::where('email', $credentials['login'])->first();

        if (! $user || ! Hash::check($credentials['password'], $user->password)) {
            throw ValidationException::withMessages([
                'login' => ['The provided credentials are incorrect.'],
            ]);
        }

        $user->tokens()->delete();
        $token = $user->createToken('auth_token')->plainTextToken;

        // Get the user's role name
        $userRole = $user->roles->first()?->name ?? 'patient';

        return response()->json([
            'message' => 'Login successful.',
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $userRole,
            ],
        ]);
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

        // Get the user's role name
        $userRole = $user->roles->first()?->name ?? 'patient';

        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $userRole,
            ],
        ]);
    }
}
