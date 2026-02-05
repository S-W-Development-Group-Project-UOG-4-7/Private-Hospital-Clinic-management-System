<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\QueueEntry;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class PatientQueueStatusTest extends TestCase
{
    use RefreshDatabase;

    private function seedRoles(): void
    {
        Role::findOrCreate('patient', 'web');
        Role::findOrCreate('doctor', 'web');
    }

    public function test_patient_queue_status_only_for_own_appointment(): void
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
            'appointment_date' => now()->toDateString(),
            'appointment_time' => '09:00:00',
            'scheduled_start' => CarbonImmutable::parse(now()->toDateString().' 09:00:00'),
            'scheduled_end' => CarbonImmutable::parse(now()->toDateString().' 09:30:00'),
            'visit_mode' => Appointment::VISIT_MODE_PHYSICAL,
            'booking_channel' => Appointment::BOOKING_CHANNEL_PATIENT_PORTAL,
            'status' => Appointment::STATUS_CONFIRMED,
            'type' => 'in_person',
        ]);

        $this->actingAs($patientB, 'sanctum');
        $this->getJson("/api/patient/appointments/{$appointment->id}/queue-status")
            ->assertStatus(404);
    }

    public function test_queue_status_is_today_only_for_same_day(): void
    {
        $this->seedRoles();

        $doctor = User::factory()->create();
        $doctor->assignRole('doctor');

        $patient = User::factory()->create();
        $patient->assignRole('patient');

        $appointment = Appointment::create([
            'patient_id' => $patient->id,
            'doctor_id' => $doctor->id,
            'appointment_date' => now()->addDay()->toDateString(),
            'appointment_time' => '10:00:00',
            'scheduled_start' => CarbonImmutable::parse(now()->addDay()->toDateString().' 10:00:00'),
            'scheduled_end' => CarbonImmutable::parse(now()->addDay()->toDateString().' 10:30:00'),
            'visit_mode' => Appointment::VISIT_MODE_PHYSICAL,
            'booking_channel' => Appointment::BOOKING_CHANNEL_PATIENT_PORTAL,
            'status' => Appointment::STATUS_CONFIRMED,
            'type' => 'in_person',
        ]);

        QueueEntry::create([
            'appointment_id' => $appointment->id,
            'patient_id' => $patient->id,
            'doctor_id' => $doctor->id,
            'queue_date' => now()->addDay()->toDateString(),
            'queue_number' => 5,
            'status' => 'waiting',
        ]);

        $this->actingAs($patient, 'sanctum');
        $this->getJson("/api/patient/appointments/{$appointment->id}/queue-status")
            ->assertStatus(200)
            ->assertJson([
                'is_today' => false,
                'current_number' => null,
                'my_position' => null,
                'estimated_wait_minutes' => null,
            ]);
    }
}
