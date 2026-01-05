<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class ReceptionistInvoiceController extends Controller
{
    public function index(Request $request)
    {
        $query = Invoice::query()->with(['patient:id,first_name,last_name,email,username,is_active', 'payments']);

        if ($request->has('status')) {
            $query->where('status', $request->get('status'));
        }

        if ($request->has('patient_id')) {
            $query->where('patient_id', (int) $request->get('patient_id'));
        }

        $invoices = $query
            ->orderBy('issued_at', 'desc')
            ->orderBy('id', 'desc')
            ->paginate((int) ($request->get('per_page') ?: 20));

        return response()->json($invoices);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'patient_id' => ['required', 'integer', 'exists:users,id'],
            'amount' => ['required', 'numeric', 'min:0.01'],
            'issued_at' => ['nullable', 'date'],
            'due_date' => ['nullable', 'date'],
            'description' => ['nullable', 'string'],
        ]);

        $invoice = Invoice::create([
            'invoice_number' => 'INV-' . Str::upper(Str::random(10)),
            'patient_id' => $validated['patient_id'],
            'amount' => $validated['amount'],
            'status' => 'unpaid',
            'issued_at' => $validated['issued_at'] ?? now()->toDateString(),
            'due_date' => $validated['due_date'] ?? null,
            'description' => $validated['description'] ?? null,
        ]);

        return response()->json($invoice->load(['patient', 'payments']), 201);
    }

    public function show(int $id)
    {
        $invoice = Invoice::with(['patient:id,first_name,last_name,email,username,is_active', 'payments'])->findOrFail($id);
        return response()->json($invoice);
    }

    public function update(Request $request, int $id)
    {
        $invoice = Invoice::findOrFail($id);

        $validated = $request->validate([
            'amount' => ['sometimes', 'numeric', 'min:0.01'],
            'status' => ['sometimes', Rule::in(['unpaid', 'partial', 'paid', 'cancelled'])],
            'issued_at' => ['sometimes', 'date'],
            'due_date' => ['nullable', 'date'],
            'description' => ['nullable', 'string'],
        ]);

        $invoice->update($validated);

        return response()->json($invoice->fresh()->load(['patient', 'payments']));
    }

    public function destroy(int $id)
    {
        $invoice = Invoice::findOrFail($id);
        $invoice->delete();

        return response()->json([
            'message' => 'Invoice deleted successfully',
        ]);
    }
}
