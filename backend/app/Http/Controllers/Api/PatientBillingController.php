<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\Payment;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class PatientBillingController extends Controller
{
    public function invoices(Request $request)
    {
        $user = $request->user();

        $invoices = Invoice::query()
            ->where('patient_id', $user->id)
            ->with(['payments'])
            ->orderBy('issued_at', 'desc')
            ->orderBy('id', 'desc')
            ->get();

        return response()->json([
            'data' => $invoices,
        ]);
    }

    public function pay(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'invoice_id' => ['required', 'integer', 'exists:invoices,id'],
            'amount' => ['required', 'numeric', 'min:0.01'],
            'method' => ['nullable', 'string', 'max:50'],
        ]);

        $invoice = Invoice::query()
            ->where('patient_id', $user->id)
            ->findOrFail($validated['invoice_id']);

        $payment = Payment::create([
            'invoice_id' => $invoice->id,
            'patient_id' => $user->id,
            'amount' => $validated['amount'],
            'method' => $validated['method'] ?? 'card',
            'status' => 'paid',
            'paid_at' => now(),
            'reference' => Str::upper(Str::random(12)),
        ]);

        $paidTotal = (float) $invoice->payments()->sum('amount');
        $invoiceAmount = (float) $invoice->amount;

        if ($paidTotal >= $invoiceAmount) {
            $invoice->status = 'paid';
        } elseif ($paidTotal > 0) {
            $invoice->status = 'partial';
        }
        $invoice->save();

        return response()->json([
            'message' => 'Payment recorded successfully',
            'payment' => $payment,
            'invoice' => $invoice->load('payments'),
        ], 201);
    }
}
