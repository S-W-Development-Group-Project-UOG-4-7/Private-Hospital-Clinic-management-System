<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class DebugPrescriptionSeeder extends Seeder
{
    public function run(): void
    {
        $doctor = DB::table('users')->where('email', 'doctor@example.com')->first();
        $patient = DB::table('users')->where('email', 'patient@example.com')->first();
        
        echo 'Doctor ID: ' . $doctor->id . PHP_EOL;
        echo 'Patient ID: ' . $patient->id . PHP_EOL;
        echo 'Appointment ID: 1' . PHP_EOL;
        echo 'Inventory IDs: ' . DB::table('inventory_items')->pluck('id')->join(',') . PHP_EOL;
        
        $this->command->info('Debug info displayed above');
    }
}
