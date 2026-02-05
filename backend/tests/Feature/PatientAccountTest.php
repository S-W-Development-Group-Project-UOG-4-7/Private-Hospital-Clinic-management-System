<?php

namespace Tests\Feature;

use App\Models\AuditLog;
use App\Models\PatientProfile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class PatientAccountTest extends TestCase
{
    use RefreshDatabase;

    public function test_patient_can_update_profile_and_audit_is_logged(): void
    {
        Role::findOrCreate('patient', 'web');

        $user = User::factory()->create([
            'first_name' => 'Jane',
            'last_name' => 'Doe',
            'email' => 'jane@example.com',
        ]);
        $user->assignRole('patient');

        $this->actingAs($user, 'sanctum');

        $payload = [
            'first_name' => 'Janet',
            'last_name' => 'Smith',
            'phone' => '+123456789',
            'date_of_birth' => '1990-01-01',
            'gender' => 'Female',
            'address' => '123 Main St',
            'nic_passport' => 'N1234567',
            'emergency_contact_name' => 'John Smith',
            'emergency_contact_phone' => '+1999888777',
            'emergency_contact_relationship' => 'Spouse',
        ];

        $response = $this->putJson('/api/patient/me', $payload);
        $response->assertStatus(200);

        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'first_name' => 'Janet',
            'last_name' => 'Smith',
        ]);

        $this->assertDatabaseHas('patient_profiles', [
            'user_id' => $user->id,
            'phone' => '+123456789',
            'address' => '123 Main St',
            'nic_passport' => 'N1234567',
            'emergency_contact_name' => 'John Smith',
            'emergency_contact_phone' => '+1999888777',
            'emergency_contact_relationship' => 'Spouse',
        ]);

        $this->assertDatabaseHas('audit_logs', [
            'user_id' => $user->id,
            'action' => 'patient_profile_updated',
        ]);
    }

    public function test_patient_can_change_password_and_audit_is_logged(): void
    {
        Role::findOrCreate('patient', 'web');

        $user = User::factory()->create([
            'password' => Hash::make('old-password'),
        ]);
        $user->assignRole('patient');

        $this->actingAs($user, 'sanctum');

        $payload = [
            'current_password' => 'old-password',
            'password' => 'new-password-123',
            'password_confirmation' => 'new-password-123',
        ];

        $response = $this->putJson('/api/patient/password', $payload);
        $response->assertStatus(200);

        $this->assertTrue(Hash::check('new-password-123', $user->refresh()->password));

        $this->assertDatabaseHas('audit_logs', [
            'user_id' => $user->id,
            'action' => 'patient_password_changed',
        ]);
    }
}
