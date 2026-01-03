<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class CreateTestAppointmentSeeder extends Seeder
{
    public function run(): void
    {
        // Get doctor and patient users
        $doctor = DB::table('users')->where('email', 'doctor@example.com')->first();
        $patient = DB::table('users')->where('email', 'patient@example.com')->first();
        
        if (!$doctor || !$patient) {
            $this->command->error('Doctor or patient not found');
            return;
        }

        // Create a test appointment
        $appointmentId = DB::table('appointments')->insertGetId([
            'patient_id' => $patient->id,
            'doctor_id' => $doctor->id,
            'appointment_date' => now()->toDateString(),
            'appointment_time' => now()->format('H:i:s'),
            'status' => 'scheduled',
            'notes' => 'Test appointment for prescription',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->command->info("Created test appointment with ID: {$appointmentId}");
    }
}
