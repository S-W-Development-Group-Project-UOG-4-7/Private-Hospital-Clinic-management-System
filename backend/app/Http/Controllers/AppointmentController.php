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
        ]);

        // Simulate checking availability. For demonstration, we'll say appointments are always available.
        return response()->json(['available' => true]);
    }
}
