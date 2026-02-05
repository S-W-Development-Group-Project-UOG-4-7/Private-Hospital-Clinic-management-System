<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\InventoryItem;
use App\Models\StockLedger;
use App\Models\Invoice;
use App\Models\User;
use App\Models\Appointment;
use App\Models\InvoiceItem;
use App\Models\Payment;
use Illuminate\Support\Str;

class DemoDataSeeder extends Seeder
{
    public function run(): void
    {
        $patient = User::role('patient')->first();
        $doctor = User::role('doctor')->first();

        if (InventoryItem::count() === 0) {
            $items = [
                ['name' => 'Paracetamol 500mg', 'quantity' => 120, 'reorder_level' => 20, 'unit_price' => 5, 'selling_price' => 8],
                ['name' => 'Amoxicillin 250mg', 'quantity' => 80, 'reorder_level' => 15, 'unit_price' => 12, 'selling_price' => 18],
                ['name' => 'Ibuprofen 200mg', 'quantity' => 60, 'reorder_level' => 10, 'unit_price' => 7, 'selling_price' => 11],
            ];

            foreach ($items as $item) {
                $created = InventoryItem::create(array_merge($item, [
                    'expiry_date' => now()->addMonths(6)->toDateString(),
                    'is_active' => true,
                ]));

                StockLedger::create([
                    'inventory_item_id' => $created->id,
                    'type' => 'PURCHASE',
                    'quantity' => $created->quantity,
                    'ref_type' => 'seed',
                    'ref_id' => $created->id,
                    'cost_price' => $created->unit_price,
                    'sell_price' => $created->selling_price,
                    'performed_by' => $doctor?->id,
                    'reason' => 'Initial demo stock',
                ]);
            }
        }

        if ($patient && Invoice::count() === 0) {
            $invoice = Invoice::create([
                'invoice_number' => 'INV-' . Str::upper(Str::random(10)),
                'patient_id' => $patient->id,
                'amount' => 1500,
                'status' => 'partial',
                'issued_at' => now()->toDateString(),
                'description' => 'Demo consultation and pharmacy',
            ]);

            InvoiceItem::create([
                'invoice_id' => $invoice->id,
                'description' => 'Consultation Fee',
                'quantity' => 1,
                'unit_price' => 1000,
                'line_total' => 1000,
            ]);

            InvoiceItem::create([
                'invoice_id' => $invoice->id,
                'description' => 'Pharmacy Items',
                'quantity' => 1,
                'unit_price' => 500,
                'line_total' => 500,
            ]);

            Payment::create([
                'invoice_id' => $invoice->id,
                'patient_id' => $patient->id,
                'amount' => 500,
                'method' => 'cash',
                'status' => 'paid',
                'paid_at' => now(),
            ]);
        }

        if ($patient && $doctor && Appointment::count() === 0) {
            Appointment::create([
                'patient_id' => $patient->id,
                'doctor_id' => $doctor->id,
                'department_id' => $doctor->department_id,
                'appointment_number' => 'APT-' . Str::upper(Str::random(8)),
                'appointment_date' => now()->toDateString(),
                'appointment_time' => now()->format('H:i'),
                'status' => Appointment::STATUS_CONFIRMED,
                'visit_mode' => Appointment::VISIT_MODE_PHYSICAL,
                'booking_channel' => Appointment::BOOKING_CHANNEL_FRONTDESK,
            ]);
        }
    }
}
