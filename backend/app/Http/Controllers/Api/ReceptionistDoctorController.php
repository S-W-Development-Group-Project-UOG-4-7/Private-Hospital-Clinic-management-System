<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;

class ReceptionistDoctorController extends Controller
{
    public function index(Request $request)
    {
        $query = User::query()
            ->role('doctor')
            ->select(['id', 'first_name', 'last_name', 'email', 'is_active']);

        if ($request->has('is_active')) {
            $query->where('is_active', (bool) $request->boolean('is_active'));
        }

        $doctors = $query
            ->orderBy('first_name')
            ->orderBy('last_name')
            ->get();

        return response()->json([
            'data' => $doctors,
        ]);
    }
}
