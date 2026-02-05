<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Prescription;
use Illuminate\Http\Request;

class PatientPrescriptionController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        $query = Prescription::query()
            ->where('patient_id', $user->id)
            ->with([
                'doctor:id,first_name,last_name,email',
                'pharmacist:id,first_name,last_name,email',
                'items.inventoryItem:id,name,generic_name,brand_name',
            ])
            ->orderBy('prescription_date', 'desc')
            ->orderBy('id', 'desc');

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        return response()->json([
            'data' => $query->get(),
        ]);
    }

    public function show(Request $request, int $id)
    {
        $user = $request->user();

        $prescription = Prescription::query()
            ->where('patient_id', $user->id)
            ->with([
                'doctor:id,first_name,last_name,email',
                'pharmacist:id,first_name,last_name,email',
                'items.inventoryItem:id,name,generic_name,brand_name',
            ])
            ->findOrFail($id);

        return response()->json($prescription);
    }
}
