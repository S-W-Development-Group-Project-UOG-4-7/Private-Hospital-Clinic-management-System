<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class AppointmentController extends Controller
{
        public function checkAvailability(Request $request)
    {
        // This is a mock implementation. In a real application, you would check the database.
        $validated = $request->validate([
            'date' => 'required|date',
            'time' => 'required',
            'doctorId' => 'required|integer',
            'clinicId' => ['nullable', 'integer', 'exists:clinics,id'],
        ]);

        if (! empty($validated['clinicId'])) {
            $doctor = \App\Models\User::find($validated['doctorId']);
            if (! $doctor || (int) $doctor->clinic_id !== (int) $validated['clinicId']) {
                return response()->json(['available' => false, 'message' => 'Doctor does not belong to the selected clinic.'], 422);
            }
        }

        // Simulate checking availability. For demonstration, we'll say appointments are always available.
        return response()->json(['available' => true]);
    }
}
