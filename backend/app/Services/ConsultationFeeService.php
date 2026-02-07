<?php

namespace App\Services;

use App\Models\Invoice;
use App\Models\Payment;
use App\Models\SystemSetting;
use App\Models\User;
use Illuminate\Support\Str;

class ConsultationFeeService
{
    public function getFee(): float
    {
        $setting = SystemSetting::query()->where('key', 'fees.consultation')->first();
        $value = $setting?->value ?? null;

        if (is_array($value)) {
            $value = $value['amount'] ?? $value['value'] ?? null;
        }

        return is_numeric($value) ? (float) $value : 0.0;
    }

    public function charge(User $patient, array $context = [], ?string $method = null): ?Invoice
    {
        $fee = $this->getFee();
        if ($fee <= 0) {
            return null;
        }

        $invoice = Invoice::create([
            'invoice_number' => 'INV-' . Str::upper(Str::random(10)),
            'patient_id' => $patient->id,
            'amount' => $fee,
            'status' => 'paid',
            'issued_at' => now()->toDateString(),
            'due_date' => null,
            'description' => $this->buildDescription($context),
        ]);

        $invoice->items()->create([
            'description' => 'Consultation Fee',
            'quantity' => 1,
            'unit_price' => $fee,
            'line_total' => $fee,
        ]);

        Payment::create([
            'invoice_id' => $invoice->id,
            'patient_id' => $patient->id,
            'amount' => $fee,
            'method' => $method ?: 'online',
            'status' => 'paid',
            'paid_at' => now(),
            'reference' => Str::upper(Str::random(12)),
        ]);

        return $invoice->load(['payments', 'items']);
    }

    private function buildDescription(array $context): string
    {
        $base = 'Consultation Fee';
        $details = array_filter([
            $context['doctor_name'] ?? null,
            $context['date'] ?? null,
            $context['time'] ?? null,
        ], fn ($value) => is_string($value) && trim($value) !== '');

        if (empty($details)) {
            return $base;
        }

        return $base . ' (' . implode(' - ', $details) . ')';
    }
}
