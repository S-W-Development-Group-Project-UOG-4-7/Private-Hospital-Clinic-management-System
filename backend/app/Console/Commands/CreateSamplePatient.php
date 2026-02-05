<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;
use App\Models\PatientProfile;
use App\Models\Prescription;
use App\Models\PrescriptionItem;
use App\Models\InventoryItem;
use App\Models\ClinicReferral;
use App\Models\Clinic;

class CreateSamplePatient extends Command
{
    protected $signature = 'patient:create-sample';
    protected $description = 'Create sample patients for testing patient lookup';

    public function handle()
    {
        // Create a sample patient user
        $patient = User::create([
            'first_name' => 'John',
            'last_name' => 'Doe',
            'username' => 'johndoe_test',
            'email' => 'john.doe.test@example.com',
            'password' => bcrypt('password123'),
            'is_active' => true,
        ]);

        $patient->assignRole('patient');

        // Create patient profile with phone number
        PatientProfile::create([
            'user_id' => $patient->id,
            'phone' => '+1234567890',
            'date_of_birth' => '1990-05-15',
            'gender' => 'male',
            'address' => '123 Main Street',
            'city' => 'New York',
            'state' => 'NY',
            'blood_type' => 'O+',
            'allergies' => 'Penicillin, Nuts',
            'medical_conditions' => 'Hypertension, Diabetes Type 2',
        ]);

        $this->info('Patient created successfully!');
        $this->info('Name: John Doe');
        $this->info('Phone: +1234567890');
        $this->info('Email: john.doe.test@example.com');

        return 0;
    }
}