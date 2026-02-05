<?php

namespace Tests\Feature;

use App\Models\Clinic;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class AppointmentClinicDefaultTest extends TestCase
{
    use RefreshDatabase;

    public function test_booking_without_clinic_defaults_to_opd()
    {
        Role::findOrCreate('patient', 'web');
        Role::findOrCreate('doctor', 'web');

        $opd = Clinic::factory()->create(['name' => 'OPD']);

        $patient = User::factory()->create();
        $patient->assignRole('patient');

        // Ensure OPD has at least one doctor so default bookings can be scheduled
        $opdDoctor = User::factory()->create(['clinic_id' => $opd->id]);
        $opdDoctor->assignRole('doctor');

        $this->actingAs($patient, 'sanctum');

        $payload = [
            'appointment_date' => '2026-02-01',
            'appointment_time' => '09:00',
        ];

        $res = $this->postJson('/api/patient/appointments', $payload);
        $res->assertStatus(201);
        $this->assertDatabaseHas('appointments', [
            'patient_id' => $patient->id,
            'clinic_id' => $opd->id,
            'appointment_time' => '09:00',
        ]);
    }

    public function test_booking_with_doctor_assigns_doctors_clinic_if_present()
    {
        Role::findOrCreate('patient', 'web');
        Role::findOrCreate('doctor', 'web');

        $cardio = Clinic::factory()->create(['name' => 'Cardiology']);

        $doctor = User::factory()->create(['clinic_id' => $cardio->id]);
        $doctor->assignRole('doctor');

        $patient = User::factory()->create();
        $patient->assignRole('patient');

        $this->actingAs($patient, 'sanctum');

        $payload = [
            'doctor_id' => $doctor->id,
            'appointment_date' => '2026-02-02',
            'appointment_time' => '10:00',
        ];

        $res = $this->postJson('/api/patient/appointments', $payload);
        $res->assertStatus(201);
        $this->assertDatabaseHas('appointments', [
            'patient_id' => $patient->id,
            'clinic_id' => $cardio->id,
            'doctor_id' => $doctor->id,
            'appointment_time' => '10:00',
        ]);
    }
}
