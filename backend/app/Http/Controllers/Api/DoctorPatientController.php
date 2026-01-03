<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Spatie\Permission\Models\Role as SpatieRole;

class DoctorPatientController extends Controller
{
    public function store(Request $request)
    {
        $doctor = $request->user();

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['nullable', 'string', 'min:8'],
            'date_of_birth' => ['nullable', 'date'],
            'phone' => ['nullable', 'string', 'max:50'],
            'gender' => ['nullable', 'string', 'max:50'],
            'blood_type' => ['nullable', 'string', 'max:5'],
            'address' => ['nullable', 'string', 'max:1000'],
            'city' => ['nullable', 'string', 'max:255'],
            'state' => ['nullable', 'string', 'max:255'],
            'postal_code' => ['nullable', 'string', 'max:50'],
        ]);

        // Build name / first/last mapping similar to other registration flows
        $fullName = trim($validated['name']);
        $parts = preg_split('/\s+/', $fullName) ?: [];
        $firstName = $parts[0] ?? $fullName;
        $lastName = count($parts) > 1 ? trim(implode(' ', array_slice($parts, 1))) : '';

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

        $password = $validated['password'] ?? Str::random(12);

        $userData = [
            'email' => $validated['email'],
            'password' => Hash::make($password),
        ];

        if (Schema::hasColumn('users', 'name')) {
            $userData['name'] = $fullName;
        } else {
            $userData['first_name'] = $firstName;
            $userData['last_name'] = $lastName ?: 'Patient';
            $userData['username'] = $username;
        }

        // Optional profile fields
        foreach (['date_of_birth', 'phone', 'gender', 'blood_type', 'address', 'city', 'state', 'postal_code'] as $f) {
            if (isset($validated[$f])) {
                $userData[$f] = $validated[$f];
            }
        }

        $user = User::create($userData);

        // Assign patient role
        SpatieRole::findOrCreate('patient', 'web');
        $user->assignRole('patient');

        // Optionally associate with creating doctor (if schema has doctor_id or patient_doctor relation not present by default)
        // For now, return created user (without password)
        $user->makeHidden(['password']);

        return response()->json(['user' => $user, 'generated_password' => $password], 201);
    }
}
