<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Invoice;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class ReceptionistInvoiceController extends Controller
{
    public function index(Request $request)
    {
        $query = Invoice::query()->with(['patient:id,first_name,last_name,email,username,is_active', 'payments', 'items']);

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
            'amount' => ['nullable', 'numeric', 'min:0.01'],
            'issued_at' => ['nullable', 'date'],
            'due_date' => ['nullable', 'date'],
            'description' => ['nullable', 'string'],
            'items' => ['nullable', 'array', 'min:1'],
            'items.*.description' => ['required_with:items', 'string', 'max:255'],
            'items.*.quantity' => ['nullable', 'numeric', 'min:0.01'],
            'items.*.unit_price' => ['required_with:items', 'numeric', 'min:0'],
        ]);

        $user = $request->user();

        return DB::transaction(function () use ($validated, $user, $request) {
            $itemsPayload = $validated['items'] ?? [];
            $items = collect($itemsPayload)->map(function (array $item) {
                $quantity = (float) ($item['quantity'] ?? 1);
                $unitPrice = (float) ($item['unit_price'] ?? 0);
                $lineTotal = $quantity * $unitPrice;

                return [
                    'description' => $item['description'],
                    'quantity' => $quantity,
                    'unit_price' => $unitPrice,
                    'line_total' => $lineTotal,
                ];
            });

            $amount = $items->isNotEmpty()
                ? (float) $items->sum('line_total')
                : (float) ($validated['amount'] ?? 0);

            if ($amount <= 0) {
                return response()->json(['message' => 'Invoice amount must be greater than zero.'], 422);
            }

            $invoice = Invoice::create([
                'invoice_number' => 'INV-' . Str::upper(Str::random(10)),
                'patient_id' => $validated['patient_id'],
                'amount' => $amount,
                'status' => 'unpaid',
                'issued_at' => $validated['issued_at'] ?? now()->toDateString(),
                'due_date' => $validated['due_date'] ?? null,
                'description' => $validated['description'] ?? null,
            ]);

            if ($items->isNotEmpty()) {
                $invoice->items()->createMany($items->all());
            }

            AuditLog::create([
                'user_id' => $user?->id,
                'action' => 'receptionist_invoice_created',
                'entity_type' => 'invoice',
                'entity_id' => $invoice->id,
                'changes' => [
                    'amount' => $invoice->amount,
                    'items_count' => $items->count(),
                ],
                'ip_address' => $request->ip(),
                'user_agent' => (string) $request->userAgent(),
            ]);

            return response()->json($invoice->load(['patient', 'payments', 'items']), 201);
        });
    }

    public function show(int $id)
    {
        $invoice = Invoice::with(['patient:id,first_name,last_name,email,username,is_active', 'payments', 'items'])->findOrFail($id);
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
            'items' => ['nullable', 'array'],
            'items.*.description' => ['required_with:items', 'string', 'max:255'],
            'items.*.quantity' => ['nullable', 'numeric', 'min:0.01'],
            'items.*.unit_price' => ['required_with:items', 'numeric', 'min:0'],
        ]);

        $user = $request->user();

        return DB::transaction(function () use ($invoice, $validated, $user, $request) {
            $itemsPayload = $validated['items'] ?? null;
            unset($validated['items']);

            if (is_array($itemsPayload)) {
                $items = collect($itemsPayload)->map(function (array $item) {
                    $quantity = (float) ($item['quantity'] ?? 1);
                    $unitPrice = (float) ($item['unit_price'] ?? 0);
                    $lineTotal = $quantity * $unitPrice;

                    return [
                        'description' => $item['description'],
                        'quantity' => $quantity,
                        'unit_price' => $unitPrice,
                        'line_total' => $lineTotal,
                    ];
                });

                $invoice->items()->delete();
                if ($items->isNotEmpty()) {
                    $invoice->items()->createMany($items->all());
                    $validated['amount'] = (float) $items->sum('line_total');
                }
            }

            $invoice->update($validated);

            AuditLog::create([
                'user_id' => $user?->id,
                'action' => 'receptionist_invoice_updated',
                'entity_type' => 'invoice',
                'entity_id' => $invoice->id,
                'changes' => $validated,
                'ip_address' => $request->ip(),
                'user_agent' => (string) $request->userAgent(),
            ]);

            return response()->json($invoice->fresh()->load(['patient', 'payments', 'items']));
        });
    }

    public function destroy(int $id)
    {
        $invoice = Invoice::findOrFail($id);
        $invoice->delete();

        AuditLog::create([
            'user_id' => request()->user()?->id,
            'action' => 'receptionist_invoice_deleted',
            'entity_type' => 'invoice',
            'entity_id' => $invoice->id,
            'changes' => [
                'invoice_number' => $invoice->invoice_number,
                'amount' => $invoice->amount,
            ],
            'ip_address' => request()->ip(),
            'user_agent' => (string) request()->userAgent(),
        ]);

        return response()->json([
            'message' => 'Invoice deleted successfully',
        ]);
    }
}
