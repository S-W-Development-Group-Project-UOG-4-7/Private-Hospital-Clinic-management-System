<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\Department;
use App\Models\Slot;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class TelemedSchedulingTest extends TestCase
{
    use RefreshDatabase;

    private function seedRoles(): void
    {
        Role::findOrCreate('doctor', 'web');
        Role::findOrCreate('patient', 'web');
    }

    private function createDoctor(): User
    {
        $department = Department::create([
            'name' => 'OPD',
            'description' => 'Outpatient Department',
        ]);

        $doctor = User::factory()->create([
            'department_id' => $department->id,
        ]);
        $doctor->assignRole('doctor');

        return $doctor;
    }

    private function createSlot(User $doctor, string $date, string $start, string $end, string $allowed = 'BOTH'): Slot
    {
        return Slot::create([
            'doctor_id' => $doctor->id,
            'date' => $date,
            'start_time' => $start,
            'end_time' => $end,
            'allowed_visit_mode' => $allowed,
            'status' => 'AVAILABLE',
        ]);
    }

    public function test_physical_online_booking_does_not_create_video_session(): void
    {
        $this->seedRoles();

        $doctor = $this->createDoctor();
        $patient = User::factory()->create();
        $patient->assignRole('patient');

        $slot = $this->createSlot($doctor, '2026-02-10', '09:00:00', '09:30:00');

        $this->actingAs($patient, 'sanctum');

        $this->postJson("/api/slots/{$slot->id}/hold", ['visit_mode' => 'PHYSICAL'])->assertStatus(200);

        $confirm = $this->postJson("/api/slots/{$slot->id}/confirm", [
            'visit_mode' => 'PHYSICAL',
        ]);

        $confirm->assertStatus(201);

        $appointmentId = $confirm->json('appointment.id');

        $this->assertDatabaseHas('appointments', [
            'id' => $appointmentId,
            'visit_mode' => 'PHYSICAL',
        ]);

        $this->assertDatabaseMissing('video_sessions', [
            'appointment_id' => $appointmentId,
        ]);
    }

    public function test_online_booking_creates_video_session(): void
    {
        $this->seedRoles();

        $doctor = $this->createDoctor();
        $patient = User::factory()->create();
        $patient->assignRole('patient');

        $slot = $this->createSlot($doctor, '2026-02-11', '10:00:00', '10:30:00');

        $this->actingAs($patient, 'sanctum');

        $this->postJson("/api/slots/{$slot->id}/hold", ['visit_mode' => 'ONLINE'])->assertStatus(200);

        $confirm = $this->postJson("/api/slots/{$slot->id}/confirm", [
            'visit_mode' => 'ONLINE',
        ]);

        $confirm->assertStatus(201);

        $appointmentId = $confirm->json('appointment.id');

        $this->assertDatabaseHas('video_sessions', [
            'appointment_id' => $appointmentId,
            'status' => 'CREATED',
        ]);
    }

    public function test_overlapping_bookings_are_rejected(): void
    {
        $this->seedRoles();

        $doctor = $this->createDoctor();
        $patient = User::factory()->create();
        $patient->assignRole('patient');

        $slot1 = $this->createSlot($doctor, '2026-02-12', '09:00:00', '09:30:00');
        $slot2 = $this->createSlot($doctor, '2026-02-12', '09:15:00', '09:45:00');

        $this->actingAs($patient, 'sanctum');

        $this->postJson("/api/slots/{$slot1->id}/hold", ['visit_mode' => 'PHYSICAL'])->assertStatus(200);
        $this->postJson("/api/slots/{$slot1->id}/confirm", ['visit_mode' => 'PHYSICAL'])->assertStatus(201);

        $this->postJson("/api/slots/{$slot2->id}/hold", ['visit_mode' => 'PHYSICAL'])->assertStatus(200);
        $conflict = $this->postJson("/api/slots/{$slot2->id}/confirm", ['visit_mode' => 'PHYSICAL']);

        $conflict->assertStatus(422);
        $conflict->assertJsonFragment(['message' => 'Selected doctor is not available at the chosen time.']);
    }

    public function test_slot_hold_prevents_race(): void
    {
        $this->seedRoles();

        $doctor = $this->createDoctor();
        $slot = $this->createSlot($doctor, '2026-02-13', '11:00:00', '11:30:00');

        $patientA = User::factory()->create();
        $patientA->assignRole('patient');

        $patientB = User::factory()->create();
        $patientB->assignRole('patient');

        $this->actingAs($patientA, 'sanctum');
        $this->postJson("/api/slots/{$slot->id}/hold", ['visit_mode' => 'PHYSICAL'])->assertStatus(200);

        $this->actingAs($patientB, 'sanctum');
        $this->postJson("/api/slots/{$slot->id}/hold", ['visit_mode' => 'PHYSICAL'])->assertStatus(409);
    }

    public function test_patient_cannot_access_other_patient_session(): void
    {
        $this->seedRoles();

        $doctor = $this->createDoctor();
        $patientA = User::factory()->create();
        $patientA->assignRole('patient');

        $patientB = User::factory()->create();
        $patientB->assignRole('patient');

        $slot = $this->createSlot($doctor, '2026-02-14', '14:00:00', '14:30:00');

        $this->actingAs($patientA, 'sanctum');
        $this->postJson("/api/slots/{$slot->id}/hold", ['visit_mode' => 'ONLINE'])->assertStatus(200);
        $confirm = $this->postJson("/api/slots/{$slot->id}/confirm", ['visit_mode' => 'ONLINE']);
        $confirm->assertStatus(201);

        $appointmentId = $confirm->json('appointment.id');

        $this->actingAs($patientB, 'sanctum');
        $this->getJson("/api/telemed/appointments/{$appointmentId}/session")
            ->assertStatus(403);
    }

    public function test_patient_cannot_join_before_live(): void
    {
        $this->seedRoles();

        $doctor = $this->createDoctor();
        $patient = User::factory()->create();
        $patient->assignRole('patient');

        $slot = $this->createSlot($doctor, '2026-02-15', '15:00:00', '15:30:00');

        $this->actingAs($patient, 'sanctum');
        $this->postJson("/api/slots/{$slot->id}/hold", ['visit_mode' => 'ONLINE'])->assertStatus(200);
        $confirm = $this->postJson("/api/slots/{$slot->id}/confirm", ['visit_mode' => 'ONLINE']);
        $confirm->assertStatus(201);

        $appointmentId = $confirm->json('appointment.id');

        $response = $this->getJson("/api/telemed/appointments/{$appointmentId}/session");
        $response->assertStatus(200);
        $response->assertJson([
            'status' => 'CREATED',
            'join_url' => null,
        ]);
    }
}
