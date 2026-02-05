<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Patient\UpdatePatientMeRequest;
use App\Http\Requests\Patient\UpdatePatientPasswordRequest;
use App\Models\AuditLog;
use App\Models\PatientProfile;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class PatientAccountController extends Controller
{
    public function show(Request $request)
    {
        $user = $request->user();

        $profile = PatientProfile::firstOrCreate([
            'user_id' => $user->id,
        ]);

        return response()->json([
            'user' => [
                'id' => $user->id,
                'first_name' => $user->first_name,
                'last_name' => $user->last_name,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
            ],
            'profile' => [
                'phone' => $profile->phone,
                'date_of_birth' => $profile->date_of_birth,
                'gender' => $profile->gender,
                'address' => $profile->address,
                'nic_passport' => $profile->nic_passport,
                'emergency_contact_name' => $profile->emergency_contact_name,
                'emergency_contact_phone' => $profile->emergency_contact_phone,
                'emergency_contact_relationship' => $profile->emergency_contact_relationship,
            ],
        ]);
    }

    public function update(UpdatePatientMeRequest $request)
    {
        $user = $request->user();
        $validated = $request->validated();

        $profile = PatientProfile::firstOrCreate([
            'user_id' => $user->id,
        ]);

        $userBefore = [
            'first_name' => $user->first_name,
            'last_name' => $user->last_name,
            'email' => $user->email,
            'phone' => $user->phone,
        ];

        $profileBefore = [
            'phone' => $profile->phone,
            'date_of_birth' => $profile->date_of_birth ? $profile->date_of_birth->format('Y-m-d') : null,
            'gender' => $profile->gender,
            'address' => $profile->address,
            'nic_passport' => $profile->nic_passport,
            'emergency_contact_name' => $profile->emergency_contact_name,
            'emergency_contact_phone' => $profile->emergency_contact_phone,
            'emergency_contact_relationship' => $profile->emergency_contact_relationship,
        ];

        if (array_key_exists('name', $validated) && ! array_key_exists('first_name', $validated) && ! array_key_exists('last_name', $validated)) {
            $name = trim((string) $validated['name']);
            if ($name !== '') {
                $parts = preg_split('/\s+/', $name, 2);
                $validated['first_name'] = $parts[0] ?? '';
                $validated['last_name'] = $parts[1] ?? '';
            }
        }

        if (array_key_exists('first_name', $validated)) {
            $user->first_name = $validated['first_name'];
        }
        if (array_key_exists('last_name', $validated)) {
            $user->last_name = $validated['last_name'];
        }
        if (array_key_exists('email', $validated)) {
            $user->email = $validated['email'];
        }
        if (array_key_exists('phone', $validated)) {
            $user->phone = $validated['phone'];
        }

        if ($user->isDirty()) {
            $user->save();
        }

        $profile->update([
            'phone' => array_key_exists('phone', $validated) ? $validated['phone'] : $profile->phone,
            'date_of_birth' => $validated['date_of_birth'] ?? $profile->date_of_birth,
            'gender' => $validated['gender'] ?? $profile->gender,
            'address' => $validated['address'] ?? $profile->address,
            'nic_passport' => $validated['nic_passport'] ?? $profile->nic_passport,
            'emergency_contact_name' => $validated['emergency_contact_name'] ?? $profile->emergency_contact_name,
            'emergency_contact_phone' => $validated['emergency_contact_phone'] ?? $profile->emergency_contact_phone,
            'emergency_contact_relationship' => $validated['emergency_contact_relationship'] ?? $profile->emergency_contact_relationship,
        ]);

        $changes = [];
        foreach ($userBefore as $key => $value) {
            if ($user->$key !== $value) {
                $changes['user.' . $key] = ['old' => $value, 'new' => $user->$key];
            }
        }
        foreach ($profileBefore as $key => $value) {
            $current = $profile->$key;
            if ($current instanceof \DateTimeInterface) {
                $current = $current->format('Y-m-d');
            }
            if ($current !== $value) {
                $changes['profile.' . $key] = ['old' => $value, 'new' => $current];
            }
        }

        if (! empty($changes)) {
            AuditLog::create([
                'user_id' => $user->id,
                'action' => 'patient_profile_updated',
                'entity_type' => 'user',
                'entity_id' => $user->id,
                'changes' => $changes,
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
            ]);
        }

        return $this->show($request);
    }

    public function updatePassword(UpdatePatientPasswordRequest $request)
    {
        $user = $request->user();
        $validated = $request->validated();

        if (! Hash::check($validated['current_password'], $user->password)) {
            return response()->json(['message' => 'Current password is incorrect.'], 422);
        }

        $user->update([
            'password' => Hash::make($validated['password']),
        ]);

        AuditLog::create([
            'user_id' => $user->id,
            'action' => 'patient_password_changed',
            'entity_type' => 'user',
            'entity_id' => $user->id,
            'changes' => null,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        return response()->json(['message' => 'Password updated successfully.']);
    }
}
