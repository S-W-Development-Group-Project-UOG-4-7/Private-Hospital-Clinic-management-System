<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class ServiceController extends Controller
{
    public function index()
    {
        $services = [
            [
                'id' => 1,
                'name' => 'General Medicine',
                'description' => 'Comprehensive primary care services for all ages including preventive care, diagnosis, and treatment of common illnesses.',
                'image' => '/images/services/general-medicine.jpg'
            ],
            [
                'id' => 2,
                'name' => 'Cardiology',
                'description' => 'Advanced heart care including diagnostics, treatment of heart diseases, and cardiovascular health management.',
                'image' => '/images/services/cardiology.jpg'
            ],
            [
                'id' => 3,
                'name' => 'Pediatrics',
                'description' => 'Specialized medical care for infants, children, and adolescents focusing on growth, development, and pediatric diseases.',
                'image' => '/images/services/pediatrics.jpg'
            ],
            [
                'id' => 4,
                'name' => 'Orthopedics',
                'description' => 'Complete musculoskeletal care including bone, joint, and ligament treatments, surgeries, and rehabilitation.',
                'image' => '/images/services/orthopedics.jpg'
            ],
            [
                'id' => 5,
                'name' => 'Neurology',
                'description' => 'Expert diagnosis and treatment of brain, spinal cord, and nervous system disorders.',
                'image' => '/images/services/neurology.jpg'
            ],
            [
                'id' => 6,
                'name' => 'Emergency Care',
                'description' => '24/7 emergency medical services for acute injuries and urgent health conditions.',
                'image' => '/images/services/emergency.jpg'
            ]
        ];

        return response()->json($services);
    }
}
