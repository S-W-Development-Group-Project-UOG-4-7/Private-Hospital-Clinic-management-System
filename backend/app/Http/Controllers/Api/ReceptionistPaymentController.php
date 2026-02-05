<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\Payment;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ReceptionistPaymentController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'invoice_id' => ['required', 'integer', 'exists:invoices,id'],
            'amount' => ['required', 'numeric', 'min:0.01'],
            'method' => ['nullable', 'string', 'max:50'],
            'status' => ['nullable', 'string', 'max:20'],
        ]);

        $invoice = Invoice::with('payments')->findOrFail($validated['invoice_id']);

        $payment = Payment::create([
            'invoice_id' => $invoice->id,
            'patient_id' => $invoice->patient_id,
            'amount' => $validated['amount'],
            'method' => $validated['method'] ?? 'cash',
            'status' => $validated['status'] ?? 'paid',
            'paid_at' => now(),
            'reference' => Str::upper(Str::random(12)),
        ]);

        $paidTotal = (float) $invoice->payments()->sum('amount');
        $invoiceAmount = (float) $invoice->amount;

        if ($paidTotal >= $invoiceAmount) {
            $invoice->status = 'paid';
        } elseif ($paidTotal > 0) {
            $invoice->status = 'partial';
        } else {
            $invoice->status = 'unpaid';
        }
        $invoice->save();

        return response()->json([
            'message' => 'Payment recorded successfully',
            'payment' => $payment,
            'invoice' => $invoice->fresh()->load('payments'),
        ], 201);
    }
}
