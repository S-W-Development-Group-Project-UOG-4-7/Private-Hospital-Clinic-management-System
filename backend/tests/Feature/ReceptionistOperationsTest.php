<?php

namespace Tests\Feature;

use App\Models\Department;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class ReceptionistOperationsTest extends TestCase
{
    use RefreshDatabase;

    public function test_receptionist_cannot_access_doctor_routes(): void
    {
        Role::findOrCreate('receptionist', 'web');

        $user = User::factory()->create();
        $user->assignRole('receptionist');

        $this->actingAs($user, 'sanctum')
            ->getJson('/api/doctor/appointments')
            ->assertForbidden();
    }

    public function test_check_in_creates_queue_entry(): void
    {
        Role::findOrCreate('receptionist', 'web');
        Role::findOrCreate('doctor', 'web');
        Role::findOrCreate('patient', 'web');

        $department = Department::create([
            'name' => 'OPD',
            'description' => 'Outpatient',
        ]);

        $doctor = User::factory()->create([
            'department_id' => $department->id,
            'is_active' => true,
        ]);
        $doctor->assignRole('doctor');

        $patient = User::factory()->create();
        $patient->assignRole('patient');

        $receptionist = User::factory()->create();
        $receptionist->assignRole('receptionist');

        $date = now()->toDateString();

        $response = $this->actingAs($receptionist, 'sanctum')->postJson('/api/receptionist/queue/check-in', [
            'patient_id' => (string) $patient->id,
            'doctor_id' => $doctor->id,
            'department_id' => $department->id,
            'queue_date' => $date,
        ]);

        $response->assertStatus(201);

        $this->assertDatabaseHas('queue_entries', [
            'patient_id' => $patient->id,
            'doctor_id' => $doctor->id,
            'queue_date' => $date,
            'status' => 'waiting',
        ]);
    }

    public function test_invoice_items_total_and_payment_status(): void
    {
        Role::findOrCreate('receptionist', 'web');
        Role::findOrCreate('patient', 'web');

        $patient = User::factory()->create();
        $patient->assignRole('patient');

        $receptionist = User::factory()->create();
        $receptionist->assignRole('receptionist');

        $createResponse = $this->actingAs($receptionist, 'sanctum')->postJson('/api/receptionist/invoices', [
            'patient_id' => $patient->id,
            'items' => [
                ['description' => 'Consultation', 'quantity' => 1, 'unit_price' => 100],
                ['description' => 'Lab test', 'quantity' => 2, 'unit_price' => 75],
            ],
        ]);

        $createResponse->assertStatus(201);
        $invoice = $createResponse->json();

        $this->assertEquals(250.0, (float) $invoice['amount']);

        $payResponse = $this->actingAs($receptionist, 'sanctum')->postJson('/api/receptionist/payments', [
            'invoice_id' => $invoice['id'],
            'amount' => 100,
            'method' => 'cash',
        ]);

        $payResponse->assertStatus(201);
        $this->assertEquals('partial', $payResponse->json('invoice.status'));

        $payResponse = $this->actingAs($receptionist, 'sanctum')->postJson('/api/receptionist/payments', [
            'invoice_id' => $invoice['id'],
            'amount' => 150,
            'method' => 'cash',
        ]);

        $payResponse->assertStatus(201);
        $this->assertEquals('paid', $payResponse->json('invoice.status'));
    }
}
