<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PatientFeedback;
use Illuminate\Http\Request;

class PatientFeedbackController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        $feedback = PatientFeedback::query()
            ->where('patient_id', $user->id)
            ->orderBy('id', 'desc')
            ->get();

        return response()->json([
            'data' => $feedback,
        ]);
    }

    public function store(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'subject' => ['required', 'string', 'max:255'],
            'message' => ['required', 'string', 'max:2000'],
            'rating' => ['nullable', 'integer', 'min:1', 'max:5'],
        ]);

        $feedback = PatientFeedback::create([
            'patient_id' => $user->id,
            'subject' => $validated['subject'],
            'message' => $validated['message'],
            'rating' => $validated['rating'] ?? null,
        ]);

        return response()->json($feedback, 201);
    }
}
