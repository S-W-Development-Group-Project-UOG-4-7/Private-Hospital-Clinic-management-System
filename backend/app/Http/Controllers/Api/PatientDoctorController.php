<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;

class PatientDoctorController extends Controller
{
    public function index(Request $request)
    {
        $validated = $request->validate([
            'department_id' => ['nullable', 'integer', 'exists:departments,id'],
        ]);

        $query = User::query()
            ->whereHas('roles', function ($q) {
                $q->where('name', 'doctor');
            })
            ->select(['id', 'first_name', 'last_name', 'email', 'department_id']);

        if (! empty($validated['department_id'])) {
            $query->where('department_id', (int) $validated['department_id']);
        }

        if (\Schema::hasColumn('users', 'is_active')) {
            $query->where('is_active', true);
        }

        $doctors = $query
            ->with('department:id,name')
            ->orderBy('first_name')
            ->orderBy('last_name')
            ->get();

        return response()->json([
            'data' => $doctors,
        ]);
    }
}
