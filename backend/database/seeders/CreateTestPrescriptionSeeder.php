<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use App\Models\User;
use Carbon\Carbon;

class CreateTestPrescriptionSeeder extends Seeder
{
    public function run(): void
    {
        // Get doctor and patient users
        $doctor = User::where('email', 'doctor@example.com')->first();
        $patient = User::where('email', 'patient@example.com')->first();
        
        if (!$doctor || !$patient) {
            $this->command->error('Doctor or patient user not found');
            return;
        }

        // Create a prescription
        $prescriptionNumber = 'RX-' . date('Y') . '-' . str_pad(rand(1, 999999), 6, '0', STR_PAD_LEFT);
        $prescriptionId = DB::table('prescriptions')->insertGetId([
            'prescription_number' => $prescriptionNumber,
            'patient_id' => $patient->id,
            'doctor_id' => $doctor->id,
            'prescription_date' => Carbon::today(),
            'notes' => 'Take medications as prescribed. Follow up in 2 weeks.',
            'instructions' => 'Take with water. Store at room temperature.',
            'status' => 'pending',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Add prescription items
        $prescriptionItems = [
            [
                'prescription_id' => $prescriptionId,
                'inventory_item_id' => 2, // Paracetamol
                'quantity' => 21,
                'dosage' => '500mg',
                'frequency' => '3 times daily',
                'duration_days' => 7,
                'instructions' => 'Take after meals',
                'unit_price' => 5.50,
                'total_price' => 115.50,
                'is_dispensed' => false,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'prescription_id' => $prescriptionId,
                'inventory_item_id' => 3, // Amoxicillin
                'quantity' => 21,
                'dosage' => '500mg',
                'frequency' => '3 times daily',
                'duration_days' => 7,
                'instructions' => 'Complete full course',
                'unit_price' => 12.75,
                'total_price' => 267.75,
                'is_dispensed' => false,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ];

        DB::table('prescription_items')->insert($prescriptionItems);

        $this->command->info("Created test prescription with ID: {$prescriptionId}");
        $this->command->info('Added 2 medications to prescription');
    }
}
