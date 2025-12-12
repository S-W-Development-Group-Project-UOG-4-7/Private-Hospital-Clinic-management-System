<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class DoctorController extends Controller
{
        public function index()
    {
        $doctors = [
            ['id' => 1, 'name' => 'Dr. John Doe', 'specialty' => 'Cardiology', 'image' => 'https://via.placeholder.com/150'],
            ['id' => 2, 'name' => 'Dr. Jane Smith', 'specialty' => 'Neurology', 'image' => 'https://via.placeholder.com/150'],
            ['id' => 3, 'name' => 'Dr. Richard Roe', 'specialty' => 'Orthopedics', 'image' => 'https://via.placeholder.com/150'],
            ['id' => 4, 'name' => 'Dr. Mary Major', 'specialty' => 'Pediatrics', 'image' => 'https://via.placeholder.com/150'],
        ];

        return response()->json($doctors);
    }
}
