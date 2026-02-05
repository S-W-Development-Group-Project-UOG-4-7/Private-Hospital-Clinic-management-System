<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class ServiceController extends Controller
{
        public function index()
    {
        $baseUrl = 'http://localhost:3000';
        $services = [
            ['id' => 1, 'name' => 'Cardiology', 'description' => 'Specialized care for heart and blood vessel disorders.', 'image' => "{$baseUrl}/images/cardiology.png"],
            ['id' => 2, 'name' => 'Neurology', 'description' => 'Treatment for disorders of the nervous system.', 'image' => "{$baseUrl}/images/neurology.png"],
            ['id' => 3, 'name' => 'Orthopedics', 'description' => 'Care for the musculoskeletal system, including bones, joints, and muscles.', 'image' => "{$baseUrl}/images/orthopedics.png"],
            ['id' => 4, 'name' => 'Pediatrics', 'description' => 'Comprehensive medical care for infants, children, and adolescents.', 'image' => "{$baseUrl}/images/pediatrics.jpg"],
            ['id' => 5, 'name' => 'Oncology', 'description' => 'Diagnosis and treatment of cancer.', 'image' => "{$baseUrl}/images/oncology.png"],
            ['id' => 6, 'name' => 'Dermatology', 'description' => 'Treatment for diseases of the skin, hair, and nails.', 'image' => "{$baseUrl}/images/dermatology.jpg"],
        ];

        return response()->json($services);
    }
}
