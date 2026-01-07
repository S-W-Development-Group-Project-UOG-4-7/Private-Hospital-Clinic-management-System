<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Referral;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ReceptionistReferralController extends Controller
{
    public function index(Request $request)
    {
        $query = Referral::query()->with([
            'patient:id,first_name,last_name,email,username,is_active',
            'referredByDoctor:id,first_name,last_name,email,username,is_active',
            'referredToDoctor:id,first_name,last_name,email,username,is_active',
        ]);

        if ($request->has('status')) {
            $query->where('status', $request->get('status'));
        }

        if ($request->has('type')) {
            $query->where('type', $request->get('type'));
        }

        if ($request->has('patient_id')) {
            $query->where('patient_id', (int) $request->get('patient_id'));
        }

        $referrals = $query
            ->orderBy('id', 'desc')
            ->paginate((int) ($request->get('per_page') ?: 20));

        return response()->json($referrals);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'patient_id' => ['required', 'integer', 'exists:users,id'],
            'referred_by_doctor_id' => ['nullable', 'integer', 'exists:users,id'],
            'referred_to_doctor_id' => ['nullable', 'integer', 'exists:users,id'],
            'type' => ['required', Rule::in(['internal', 'external'])],
            'external_provider' => ['nullable', 'string', 'max:255'],
            'reason' => ['nullable', 'string'],
            'status' => ['nullable', Rule::in(['pending', 'accepted', 'completed', 'cancelled'])],
            'referred_at' => ['nullable', 'date'],
            'notes' => ['nullable', 'string'],
            'report_url' => ['nullable', 'string', 'max:255'],
        ]);

        $referral = Referral::create([
            'patient_id' => $validated['patient_id'],
            'referred_by_doctor_id' => $validated['referred_by_doctor_id'] ?? null,
            'referred_to_doctor_id' => $validated['referred_to_doctor_id'] ?? null,
            'type' => $validated['type'],
            'external_provider' => $validated['external_provider'] ?? null,
            'reason' => $validated['reason'] ?? null,
            'status' => $validated['status'] ?? 'pending',
            'referred_at' => $validated['referred_at'] ?? now()->toDateString(),
            'notes' => $validated['notes'] ?? null,
            'report_url' => $validated['report_url'] ?? null,
            'created_by' => $request->user()?->id,
        ]);

        return response()->json($referral->load(['patient', 'referredByDoctor', 'referredToDoctor']), 201);
    }

    public function show(int $id)
    {
        $referral = Referral::with([
            'patient:id,first_name,last_name,email,username,is_active',
            'referredByDoctor:id,first_name,last_name,email,username,is_active',
            'referredToDoctor:id,first_name,last_name,email,username,is_active',
        ])->findOrFail($id);

        return response()->json($referral);
    }

    public function update(Request $request, int $id)
    {
        $referral = Referral::findOrFail($id);

        $validated = $request->validate([
            'referred_by_doctor_id' => ['nullable', 'integer', 'exists:users,id'],
            'referred_to_doctor_id' => ['nullable', 'integer', 'exists:users,id'],
            'type' => ['sometimes', Rule::in(['internal', 'external'])],
            'external_provider' => ['nullable', 'string', 'max:255'],
            'reason' => ['nullable', 'string'],
            'status' => ['sometimes', Rule::in(['pending', 'accepted', 'completed', 'cancelled'])],
            'referred_at' => ['nullable', 'date'],
            'notes' => ['nullable', 'string'],
            'report_url' => ['nullable', 'string', 'max:255'],
        ]);

        $referral->update($validated);

        return response()->json($referral->fresh()->load(['patient', 'referredByDoctor', 'referredToDoctor']));
    }

    public function destroy(int $id)
    {
        $referral = Referral::findOrFail($id);
        $referral->delete();

        return response()->json([
            'message' => 'Referral deleted successfully',
        ]);
    }
}
