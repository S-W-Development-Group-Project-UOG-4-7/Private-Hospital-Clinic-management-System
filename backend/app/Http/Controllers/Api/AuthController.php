<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\PatientProfile;
use App\Mail\PasswordResetMail;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
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
            'email' => ['required', 'email', 'max:255'],
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
            'claim_existing' => ['nullable', 'boolean'],
        ]);

        // Public signup is patient-only
        $roleName = 'patient';
        $claimExisting = (bool) $request->boolean('claim_existing');

        $fullName = trim($data['name']);
        $parts = preg_split('/\s+/', $fullName) ?: [];
        $firstName = $parts[0] ?? $fullName;
        $lastName = count($parts) > 1 ? trim(implode(' ', array_slice($parts, 1))) : 'Patient';

        $existingPatient = $this->findPatientByPhone($data['phone'] ?? null);
        if ($existingPatient) {
            if (! $claimExisting) {
                throw ValidationException::withMessages([
                    'phone' => ['An account with this phone already exists. Please log in.'],
                ]);
            }

            $existingEmail = (string) ($existingPatient->email ?? '');
            $existingIsPlaceholder = str_ends_with($existingEmail, '@mediclinic.local');
            if (! $existingIsPlaceholder && $existingEmail !== $data['email']) {
                throw ValidationException::withMessages([
                    'phone' => ['An account with this phone already exists. Please log in.'],
                ]);
            }

            $emailTaken = User::where('email', $data['email'])
                ->where('id', '!=', $existingPatient->id)
                ->exists();
            if ($emailTaken) {
                throw ValidationException::withMessages([
                    'email' => ['The email has already been taken.'],
                ]);
            }

            $existingPatient->load('patientProfile');

            $userUpdates = [
                'email' => $data['email'],
                'password' => Hash::make($data['password']),
            ];

            if (Schema::hasColumn('users', 'name') && empty((string) $existingPatient->name)) {
                $userUpdates['name'] = $fullName;
            }

            if (array_key_exists('phone', $data)) {
                $userUpdates['phone'] = $data['phone'];
            }

            if (empty((string) $existingPatient->first_name)) {
                $userUpdates['first_name'] = $firstName;
            }
            if (empty((string) $existingPatient->last_name)) {
                $userUpdates['last_name'] = $lastName ?: 'Patient';
            }

            $existingPatient->fill($userUpdates);
            $existingPatient->save();

            SpatieRole::findOrCreate($roleName, 'sanctum');
            if (! $existingPatient->hasRole($roleName)) {
                $existingPatient->assignRole($roleName);
            }

            $profile = $existingPatient->patientProfile;
            PatientProfile::updateOrCreate(
                ['user_id' => $existingPatient->id],
                [
                    'phone' => $data['phone'] ?? $profile?->phone,
                    'date_of_birth' => $data['date_of_birth'] ?? $profile?->date_of_birth,
                    'gender' => $data['gender'] ?? $profile?->gender,
                    'address' => $data['address'] ?? $profile?->address,
                    'blood_type' => $data['blood_type'] ?? $profile?->blood_type,
                    'city' => $data['city'] ?? $profile?->city,
                    'state' => $data['state'] ?? $profile?->state,
                    'postal_code' => $data['postal_code'] ?? $profile?->postal_code,
                    'guardian_name' => $data['guardian_name'] ?? $profile?->guardian_name,
                    'guardian_email' => $data['guardian_email'] ?? $profile?->guardian_email,
                    'guardian_phone' => $data['guardian_phone'] ?? $profile?->guardian_phone,
                    'guardian_relationship' => $data['guardian_relationship'] ?? $profile?->guardian_relationship,
                ]
            );

            $existingPatient->tokens()->delete();
            $token = $existingPatient->createToken('auth_token')->plainTextToken;

            Log::info('Account linked to existing patient record', ['id' => $existingPatient->id, 'email' => $existingPatient->email]);

            return response()->json([
                'message' => 'Account linked successfully.',
                'token' => $token,
                'user' => $this->formatUserData($existingPatient),
            ], 200);
        }

        if (User::where('email', $data['email'])->exists()) {
            throw ValidationException::withMessages([
                'email' => ['The email has already been taken.'],
            ]);
        }

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

        // Always set required user fields for this schema (first_name/last_name/username)
        $userData = [
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
            'first_name' => $firstName,
            'last_name' => $lastName ?: 'Patient',
            'username' => $username,
        ];

        if (Schema::hasColumn('users', 'name')) {
            $userData['name'] = $fullName;
        }

        if (array_key_exists('phone', $data)) {
            $userData['phone'] = $data['phone'];
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

    /**
     * Handle forgot password request.
     */
    public function forgotPassword(Request $request)
    {
        $request->validate([
            'email' => ['required', 'email'],
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user) {
            // Return success even if user not found (security best practice)
            return response()->json([
                'message' => 'If an account with that email exists, we have sent a password reset link.',
            ]);
        }

        // Generate a simple token
        $token = Str::random(64);

        // Store the reset token
        DB::table('password_reset_tokens')->updateOrInsert(
            ['email' => $request->email],
            [
                'email' => $request->email,
                'token' => Hash::make($token),
                'created_at' => now(),
            ]
        );

        // Build the reset URL
        $resetUrl = config('app.frontend_url', 'http://localhost:3000') . '/reset-password?token=' . $token . '&email=' . urlencode($request->email);
        
        // Get user's name for personalization
        $userName = $user->first_name ?? $user->name ?? 'User';

        // Log the reset link to console/log file (for development)
        Log::info('===========================================');
        Log::info('PASSWORD RESET LINK GENERATED');
        Log::info('===========================================');
        Log::info('Email: ' . $request->email);
        Log::info('Reset URL: ' . $resetUrl);
        Log::info('===========================================');
        
        // Output directly to terminal (stderr) for easy visibility
        error_log('');
        error_log('===========================================');
        error_log('🔑 PASSWORD RESET LINK GENERATED');
        error_log('===========================================');
        error_log('📧 Email: ' . $request->email);
        error_log('🔗 Reset URL: ' . $resetUrl);
        error_log('===========================================');
        error_log('');

        // Send the password reset email
        try {
            Mail::to($user->email)->send(new PasswordResetMail($resetUrl, $userName));
            
            Log::info('Password reset email sent successfully to: ' . $request->email);
        } catch (\Exception $e) {
            Log::error('Failed to send password reset email', [
                'email' => $request->email,
                'error' => $e->getMessage(),
            ]);
            
            // Still return success to not reveal if email exists
            // But log the error for debugging
        }

        return response()->json([
            'message' => 'If an account with that email exists, we have sent a password reset link.',
        ]);
    }

    /**
     * Handle password reset.
     */
    public function resetPassword(Request $request)
    {
        $request->validate([
            'token' => ['required', 'string'],
            'email' => ['required', 'email'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        $record = DB::table('password_reset_tokens')
            ->where('email', $request->email)
            ->first();

        if (!$record) {
            throw ValidationException::withMessages([
                'email' => ['Invalid password reset request.'],
            ]);
        }

        // Check if token is valid
        if (!Hash::check($request->token, $record->token)) {
            throw ValidationException::withMessages([
                'token' => ['Invalid or expired reset token.'],
            ]);
        }

        // Check if token is expired (1 hour)
        if (now()->diffInMinutes($record->created_at) > 60) {
            throw ValidationException::withMessages([
                'token' => ['This password reset link has expired.'],
            ]);
        }

        // Update user password
        $user = User::where('email', $request->email)->first();
        
        if (!$user) {
            throw ValidationException::withMessages([
                'email' => ['User not found.'],
            ]);
        }

        $user->password = Hash::make($request->password);
        $user->save();

        // Delete the reset token
        DB::table('password_reset_tokens')->where('email', $request->email)->delete();

        // Revoke all existing tokens
        $user->tokens()->delete();

        Log::info('Password reset successful', ['user_id' => $user->id]);

        return response()->json([
            'message' => 'Password has been reset successfully. You can now login with your new password.',
        ]);
    }

    private function findPatientByPhone(?string $phone): ?User
    {
        $phone = trim((string) $phone);
        if ($phone === '') {
            return null;
        }

        $normalized = preg_replace('/\D+/', '', $phone);
        if (! $normalized || strlen($normalized) < 7) {
            return null;
        }

        $driver = DB::connection()->getDriverName();
        $patientId = null;

        if (Schema::hasColumn('patient_profiles', 'phone')) {
            $query = PatientProfile::query();
            if ($driver === 'pgsql') {
                $query->whereRaw("regexp_replace(phone, '\\\\D', '', 'g') = ?", [$normalized]);
            } else {
                $query->where('phone', $phone);
            }
            $patientId = $query->value('user_id');
        }

        if (! $patientId && Schema::hasColumn('users', 'phone')) {
            $userQuery = User::query();
            if ($driver === 'pgsql') {
                $userQuery->whereRaw("regexp_replace(phone, '\\\\D', '', 'g') = ?", [$normalized]);
            } else {
                $userQuery->where('phone', $phone);
            }
            $patientId = $userQuery->value('id');
        }

        if (! $patientId) {
            return null;
        }

        return User::role('patient')->where('id', $patientId)->first();
    }
}
