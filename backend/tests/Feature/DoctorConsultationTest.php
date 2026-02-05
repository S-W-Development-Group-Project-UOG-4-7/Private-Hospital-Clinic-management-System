<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\LabOrder;
use App\Models\LabResult;
use App\Models\Prescription;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class DoctorConsultationTest extends TestCase
{
    use RefreshDatabase;

    public function test_doctor_cannot_access_other_doctor_consultation(): void
    {
        Role::findOrCreate('doctor', 'web');
        Role::findOrCreate('patient', 'web');

        $doctorA = User::factory()->create();
        $doctorA->assignRole('doctor');

        $doctorB = User::factory()->create();
        $doctorB->assignRole('doctor');

        $patient = User::factory()->create();
        $patient->assignRole('patient');

        $appointment = Appointment::create([
            'patient_id' => $patient->id,
            'doctor_id' => $doctorA->id,
            'appointment_date' => now()->toDateString(),
            'appointment_time' => now()->format('H:i:s'),
            'status' => Appointment::STATUS_CONFIRMED,
        ]);

        $this->actingAs($doctorB, 'sanctum')
            ->getJson("/api/doctor/appointments/{$appointment->id}/consultation")
            ->assertStatus(404);
    }

    public function test_prescription_amendment_creates_new_version(): void
    {
        Role::findOrCreate('doctor', 'web');
        Role::findOrCreate('patient', 'web');

        $doctor = User::factory()->create();
        $doctor->assignRole('doctor');

        $patient = User::factory()->create();
        $patient->assignRole('patient');

        $payload = [
            'patient_id' => $patient->id,
            'prescription_date' => now()->toDateString(),
            'items' => [
                [
                    'medicine_name' => 'Amoxicillin',
                    'quantity' => 10,
                ],
            ],
        ];

        $createResponse = $this->actingAs($doctor, 'sanctum')
            ->postJson('/api/doctor/prescriptions', $payload);

        $createResponse->assertStatus(201);
        $originalId = $createResponse->json('id');

        $updatePayload = [
            'prescription_date' => now()->toDateString(),
            'items' => [
                [
                    'medicine_name' => 'Amoxicillin',
                    'quantity' => 14,
                ],
            ],
        ];

        $updateResponse = $this->actingAs($doctor, 'sanctum')
            ->putJson("/api/doctor/prescriptions/{$originalId}", $updatePayload);

        $updateResponse->assertStatus(200);
        $newId = $updateResponse->json('id');

        $this->assertNotEquals($originalId, $newId);

        $this->assertDatabaseHas('prescriptions', [
            'id' => $originalId,
            'version' => 1,
        ]);

        $this->assertDatabaseHas('prescriptions', [
            'id' => $newId,
            'previous_prescription_id' => $originalId,
            'version' => 2,
        ]);
    }

    public function test_lab_review_marks_order_reviewed(): void
    {
        Role::findOrCreate('doctor', 'web');
        Role::findOrCreate('patient', 'web');

        $doctor = User::factory()->create();
        $doctor->assignRole('doctor');

        $patient = User::factory()->create();
        $patient->assignRole('patient');

        $labOrder = LabOrder::create([
            'order_number' => 'LAB-TEST-01',
            'patient_id' => $patient->id,
            'doctor_id' => $doctor->id,
            'test_type' => 'CBC',
            'status' => 'ORDERED',
            'order_date' => now()->toDateString(),
        ]);

        $labResult = LabResult::create([
            'lab_order_id' => $labOrder->id,
            'patient_id' => $patient->id,
            'doctor_id' => null,
            'test_name' => 'CBC',
            'status' => 'normal',
            'result_date' => now()->toDateString(),
        ]);

        $response = $this->actingAs($doctor, 'sanctum')
            ->postJson("/api/doctor/labs/results/{$labResult->id}/review", [
                'doctor_notes' => 'Reviewed',
            ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('lab_orders', [
            'id' => $labOrder->id,
            'status' => 'REVIEWED',
        ]);
    }
}
