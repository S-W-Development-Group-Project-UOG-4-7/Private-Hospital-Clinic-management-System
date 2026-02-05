<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class TestimonialController extends Controller
{
        public function index()
    {
        $testimonials = [
            ['id' => 1, 'name' => 'John Smith', 'rating' => 5, 'review' => 'The care I received was exceptional. The staff was professional and compassionate.'],
            ['id' => 2, 'name' => 'Emily Johnson', 'rating' => 5, 'review' => 'A wonderful experience from start to finish. The doctors are knowledgeable and attentive.'],
            ['id' => 3, 'name' => 'Michael Williams', 'rating' => 4, 'review' => 'Great facilities and a friendly team. I felt well-cared for throughout my treatment.'],
            ['id' => 4, 'name' => 'Sarah Brown', 'rating' => 5, 'review' => 'The telemedicine service was convenient and effective. Highly recommended.'],
        ];

        return response()->json($testimonials);
    }
}
