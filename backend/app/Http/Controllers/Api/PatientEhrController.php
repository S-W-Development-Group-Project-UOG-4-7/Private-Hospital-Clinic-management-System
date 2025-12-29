<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\EhrRecord;
use Illuminate\Http\Request;

class PatientEhrController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        $records = EhrRecord::query()
            ->where('patient_id', $user->id)
            ->with(['doctor:id,first_name,last_name,email'])
            ->orderBy('record_date', 'desc')
            ->orderBy('id', 'desc')
            ->get();

        return response()->json([
            'data' => $records,
        ]);
    }
}
