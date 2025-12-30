<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PatientNotification;
use Illuminate\Http\Request;

class PatientNotificationController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        $notifications = PatientNotification::query()
            ->where('patient_id', $user->id)
            ->orderByRaw('read_at is null desc')
            ->orderBy('id', 'desc')
            ->get();

        return response()->json([
            'data' => $notifications,
        ]);
    }
}
