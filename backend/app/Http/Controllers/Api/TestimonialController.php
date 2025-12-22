<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class TestimonialController extends Controller
{
    public function index()
    {
        $testimonials = [
            [
                'id' => 1,
                'name' => 'Sarah Johnson',
                'role' => 'Patient',
                'content' => 'The care I received was exceptional. The doctors were knowledgeable and the staff was incredibly supportive throughout my treatment.',
                'rating' => 5,
                'review' => 'The care I received was exceptional. The doctors were knowledgeable and the staff was incredibly supportive throughout my treatment.',
                'image' => '/images/testimonials/sarah.jpg'
            ],
            [
                'id' => 2,
                'name' => 'Michael Chen',
                'role' => 'Patient',
                'content' => 'I\'m impressed by the professionalism and efficiency of this hospital. From diagnosis to recovery, everything was handled perfectly.',
                'rating' => 5,
                'review' => 'I\'m impressed by the professionalism and efficiency of this hospital. From diagnosis to recovery, everything was handled perfectly.',
                'image' => '/images/testimonials/michael.jpg'
            ],
            [
                'id' => 3,
                'name' => 'Emily Rodriguez',
                'role' => 'Patient',
                'content' => 'The emergency care team saved my life. Their quick response and expert care made all the difference in my recovery.',
                'rating' => 5,
                'review' => 'The emergency care team saved my life. Their quick response and expert care made all the difference in my recovery.',
                'image' => '/images/testimonials/emily.jpg'
            ],
            [
                'id' => 4,
                'name' => 'David Thompson',
                'role' => 'Patient Family',
                'content' => 'My father received excellent cardiac care here. The doctors explained everything clearly and made us feel comfortable throughout the process.',
                'rating' => 5,
                'review' => 'My father received excellent cardiac care here. The doctors explained everything clearly and made us feel comfortable throughout the process.',
                'image' => '/images/testimonials/david.jpg'
            ],
            [
                'id' => 5,
                'name' => 'Lisa Anderson',
                'role' => 'Patient',
                'content' => 'The pediatric department is amazing. They treated my child with such care and patience. Highly recommend!',
                'rating' => 5,
                'review' => 'The pediatric department is amazing. They treated my child with such care and patience. Highly recommend!',
                'image' => '/images/testimonials/lisa.jpg'
            ]
        ];

        return response()->json($testimonials);
    }
}
