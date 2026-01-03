<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\Clinic;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class ClinicSlotsTest extends TestCase
{
    use RefreshDatabase;

    public function test_slots_reflect_doctor_appointments()
    {
        Role::findOrCreate('doctor', 'web');

        $clinic = Clinic::factory()->create();

        $doctor1 = User::factory()->create(['clinic_id' => $clinic->id]);
        $doctor1->assignRole('doctor');

        $doctor2 = User::factory()->create(['clinic_id' => $clinic->id]);
        $doctor2->assignRole('doctor');

        // Create an appointment for doctor1 at 09:00 on 2026-01-15
        Appointment::create([
            'patient_id' => $doctor1->id, // reuse user as patient for test
            'doctor_id' => $doctor1->id,
            'clinic_id' => $clinic->id,
            'appointment_date' => '2026-01-15',
            'appointment_time' => '09:00',
            'status' => 'scheduled',
        ]);

        $this->assertDatabaseHas('appointments', [
            'doctor_id' => $doctor1->id,
            'clinic_id' => $clinic->id,
            'appointment_time' => '09:00',
        ]);

        $response = $this->getJson("/api/clinics/{$clinic->id}/slots?date=2026-01-15");
        $response->assertStatus(200);
        $response->dump();
        $data = $response->json();

        // find 09:00 and assert available_count is 1 (2 doctors total, 1 booked)
        $slots = collect($data['slots']);
        $slot09 = $slots->firstWhere('time', '09:00');
        $this->assertNotNull($slot09);
        $this->assertEquals(1, $slot09['available_count']);

        // check another slot (08:00) is fully available (2)
        $slot08 = $slots->firstWhere('time', '08:00');
        $this->assertNotNull($slot08);
        $this->assertEquals(2, $slot08['available_count']);
    }

    public function test_booking_without_doctor_respects_capacity()
    {
        Role::findOrCreate('doctor', 'web');
        Role::findOrCreate('patient', 'web');

        $clinic = Clinic::factory()->create();

        $doctor1 = User::factory()->create(['clinic_id' => $clinic->id]);
        $doctor1->assignRole('doctor');

        $doctor2 = User::factory()->create(['clinic_id' => $clinic->id]);
        $doctor2->assignRole('doctor');

        // Book both doctors at 10:00
        Appointment::create([
            'patient_id' => $doctor1->id,
            'doctor_id' => $doctor1->id,
            'clinic_id' => $clinic->id,
            'appointment_date' => '2026-01-20',
            'appointment_time' => '10:00',
            'status' => 'scheduled',
        ]);
        Appointment::create([
            'patient_id' => $doctor2->id,
            'doctor_id' => $doctor2->id,
            'clinic_id' => $clinic->id,
            'appointment_date' => '2026-01-20',
            'appointment_time' => '10:00',
            'status' => 'scheduled',
        ]);

        // Attempt to book a patient appointment for the clinic at 10:00 without doctor
        $patient = User::factory()->create();
        $patient->assignRole('patient');

        $this->actingAs($patient, 'sanctum');

        $payload = [
            'clinic_id' => $clinic->id,
            'appointment_date' => '2026-01-20',
            'appointment_time' => '10:00',
        ];

        $response = $this->postJson('/api/patient/appointments', $payload);
        $response->assertStatus(422);
        $response->assertJsonFragment(['message' => 'No doctors available in this clinic at the chosen time.']);
    }
}
