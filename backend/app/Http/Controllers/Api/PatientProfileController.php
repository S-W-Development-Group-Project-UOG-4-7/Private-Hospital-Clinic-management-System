<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PatientProfile;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class PatientProfileController extends Controller
{
    public function show(Request $request)
    {
        $user = $request->user();

        $profile = PatientProfile::firstOrCreate([
            'user_id' => $user->id,
        ]);

        $role = $user->roles->first()?->name ?? ($user->role?->slug ?: ($user->role?->name ? strtolower($user->role->name) : 'patient'));

        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $role,
            ],
            'profile' => [
                'phone' => $profile->phone,
                'date_of_birth' => $profile->date_of_birth,
                'gender' => $profile->gender,
                'address' => $profile->address,
            ],
        ]);
    }

    public function update(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'email' => ['sometimes', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user->id)],
            'phone' => ['nullable', 'string', 'max:50'],
            'date_of_birth' => ['nullable', 'date'],
            'gender' => ['nullable', 'string', 'max:50'],
            'address' => ['nullable', 'string', 'max:255'],
        ]);

        if (array_key_exists('email', $validated)) {
            $user->email = $validated['email'];
            $user->save();
        }

        $profile = PatientProfile::firstOrCreate([
            'user_id' => $user->id,
        ]);

        $profile->update([
            'phone' => $validated['phone'] ?? $profile->phone,
            'date_of_birth' => $validated['date_of_birth'] ?? $profile->date_of_birth,
            'gender' => $validated['gender'] ?? $profile->gender,
            'address' => $validated['address'] ?? $profile->address,
        ]);

        return $this->show($request);
    }
}
