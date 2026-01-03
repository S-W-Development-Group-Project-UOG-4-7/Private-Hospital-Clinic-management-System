<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Teleconsultation;
use Illuminate\Http\Request;

class PatientTeleconsultationController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        $teleconsultations = Teleconsultation::query()
            ->where('patient_id', $user->id)
            ->with(['doctor:id,first_name,last_name,email'])
            ->orderBy('scheduled_at', 'desc')
            ->get();

        return response()->json([
            'data' => $teleconsultations,
        ]);
    }
}
