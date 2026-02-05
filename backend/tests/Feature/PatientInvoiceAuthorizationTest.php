<?php

namespace Tests\Feature;

use App\Models\Invoice;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class PatientInvoiceAuthorizationTest extends TestCase
{
    use RefreshDatabase;

    public function test_patient_cannot_access_other_patient_invoice(): void
    {
        Role::findOrCreate('patient', 'web');

        $patientA = User::factory()->create();
        $patientA->assignRole('patient');

        $patientB = User::factory()->create();
        $patientB->assignRole('patient');

        $invoice = Invoice::create([
            'invoice_number' => 'INV-001',
            'patient_id' => $patientA->id,
            'amount' => 100,
            'status' => 'unpaid',
            'issued_at' => now(),
        ]);

        $this->actingAs($patientB, 'sanctum');
        $this->getJson("/api/patient/invoices/{$invoice->id}")
            ->assertStatus(404);
    }
}
