<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\Slot;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class PatientSlotBookingTest extends TestCase
{
    use RefreshDatabase;

    private function seedRoles(): void
    {
        Role::findOrCreate('patient', 'web');
        Role::findOrCreate('doctor', 'web');
    }

    public function test_patient_can_hold_and_confirm_slot(): void
    {
        $this->seedRoles();

        $doctor = User::factory()->create();
        $doctor->assignRole('doctor');

        $patient = User::factory()->create();
        $patient->assignRole('patient');

        $slot = Slot::create([
            'doctor_id' => $doctor->id,
            'date' => '2026-02-10',
            'start_time' => '09:00:00',
            'end_time' => '09:30:00',
            'allowed_visit_mode' => 'PHYSICAL',
            'status' => 'AVAILABLE',
        ]);

        $this->actingAs($patient, 'sanctum');

        $hold = $this->postJson("/api/patient/slots/{$slot->id}/hold", ['visit_mode' => 'PHYSICAL']);
        $hold->assertStatus(200);

        $confirm = $this->postJson("/api/patient/slots/{$slot->id}/confirm", [
            'visit_mode' => 'PHYSICAL',
        ]);
        $confirm->assertStatus(201);

        $this->assertDatabaseHas('appointments', [
            'patient_id' => $patient->id,
            'doctor_id' => $doctor->id,
            'appointment_date' => '2026-02-10',
            'appointment_time' => '09:00:00',
            'status' => Appointment::STATUS_CONFIRMED,
        ]);

        $this->assertDatabaseHas('slots', [
            'id' => $slot->id,
            'status' => 'BOOKED',
        ]);
    }

    public function test_double_booking_is_prevented(): void
    {
        $this->seedRoles();

        $doctor = User::factory()->create();
        $doctor->assignRole('doctor');

        $patientA = User::factory()->create();
        $patientA->assignRole('patient');

        $patientB = User::factory()->create();
        $patientB->assignRole('patient');

        $slot = Slot::create([
            'doctor_id' => $doctor->id,
            'date' => '2026-02-10',
            'start_time' => '10:00:00',
            'end_time' => '10:30:00',
            'allowed_visit_mode' => 'PHYSICAL',
            'status' => 'AVAILABLE',
        ]);

        $this->actingAs($patientA, 'sanctum');
        $this->postJson("/api/patient/slots/{$slot->id}/hold", ['visit_mode' => 'PHYSICAL'])->assertStatus(200);
        $this->postJson("/api/patient/slots/{$slot->id}/confirm", ['visit_mode' => 'PHYSICAL'])->assertStatus(201);

        $this->actingAs($patientB, 'sanctum');
        $this->postJson("/api/patient/slots/{$slot->id}/hold", ['visit_mode' => 'PHYSICAL'])->assertStatus(409);
    }

    public function test_expired_hold_is_treated_as_available(): void
    {
        $this->seedRoles();

        $doctor = User::factory()->create();
        $doctor->assignRole('doctor');

        $patient = User::factory()->create();
        $patient->assignRole('patient');

        $slot = Slot::create([
            'doctor_id' => $doctor->id,
            'date' => '2026-02-11',
            'start_time' => '11:00:00',
            'end_time' => '11:30:00',
            'allowed_visit_mode' => 'PHYSICAL',
            'status' => 'HELD',
            'held_until' => CarbonImmutable::now()->subMinutes(10),
            'held_by_patient_id' => $patient->id,
        ]);

        $this->actingAs($patient, 'sanctum');

        $res = $this->getJson("/api/patient/slots?date=2026-02-11&doctor_id={$doctor->id}&available_only=1");
        $res->assertStatus(200);
        $this->assertDatabaseHas('slots', [
            'id' => $slot->id,
            'status' => 'AVAILABLE',
        ]);
    }

    public function test_patient_can_only_cancel_or_reschedule_own_appointment(): void
    {
        $this->seedRoles();

        $doctor = User::factory()->create();
        $doctor->assignRole('doctor');

        $patientA = User::factory()->create();
        $patientA->assignRole('patient');

        $patientB = User::factory()->create();
        $patientB->assignRole('patient');

        $appointment = Appointment::create([
            'patient_id' => $patientA->id,
            'doctor_id' => $doctor->id,
            'appointment_date' => '2026-02-12',
            'appointment_time' => '09:00:00',
            'scheduled_start' => CarbonImmutable::parse('2026-02-12 09:00:00'),
            'scheduled_end' => CarbonImmutable::parse('2026-02-12 09:30:00'),
            'visit_mode' => Appointment::VISIT_MODE_PHYSICAL,
            'booking_channel' => Appointment::BOOKING_CHANNEL_PATIENT_PORTAL,
            'status' => Appointment::STATUS_CONFIRMED,
            'type' => 'in_person',
        ]);

        $slot = Slot::create([
            'doctor_id' => $doctor->id,
            'date' => '2026-02-13',
            'start_time' => '10:00:00',
            'end_time' => '10:30:00',
            'allowed_visit_mode' => 'PHYSICAL',
            'status' => 'AVAILABLE',
        ]);

        $this->actingAs($patientB, 'sanctum');

        $this->postJson("/api/patient/appointments/{$appointment->id}/cancel")
            ->assertStatus(404);

        $this->postJson("/api/patient/appointments/{$appointment->id}/reschedule", [
            'slot_id' => $slot->id,
        ])->assertStatus(404);
    }
}
