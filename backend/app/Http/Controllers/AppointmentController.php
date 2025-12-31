<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Appointment;
use Illuminate\Support\Facades\Validator;

class AppointmentController extends Controller
{
    // 1. Get all appointments (with Patient and Doctor names)
    public function index()
    {
        // We use 'with' to automatically load the names from the users table
        $appointments = Appointment::with(['patient', 'doctor'])
            ->orderBy('appointment_date', 'asc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $appointments
        ]);
    }

    // 2. Create a new appointment
    public function store(Request $request)
    {
        // Validate inputs
        $validator = Validator::make($request->all(), [
            'patient_id' => 'required|exists:users,id',
            'doctor_id' => 'required|exists:users,id',
            'appointment_date' => 'required|date',
            'notes' => 'nullable|string'
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'message' => $validator->errors()], 422);
        }

        // Create
        $appointment = Appointment::create([
            'patient_id' => $request->patient_id,
            'doctor_id' => $request->doctor_id,
            'appointment_date' => $request->appointment_date,
            'status' => 'scheduled',
            'notes' => $request->notes
        ]);

        return response()->json([
            'success' => true, 
            'message' => 'Appointment scheduled successfully',
            'data' => $appointment
        ]);
    }

    // 3. Delete (Cancel) an appointment
    public function destroy($id)
    {
        $appointment = Appointment::find($id);
        
        if (!$appointment) {
            return response()->json(['success' => false, 'message' => 'Appointment not found'], 404);
        }

        $appointment->delete();

        return response()->json(['success' => true, 'message' => 'Appointment cancelled']);
    }
}