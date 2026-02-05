<?php

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use App\Models\PatientProfile;
use App\Models\Prescription;
use App\Models\PrescriptionItem;
use App\Models\InventoryItem;
use App\Models\ClinicReferral;
use App\Models\Clinic;

class PatientDataSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create a sample patient user
        $patient = User::create([
            'first_name' => 'John',
            'last_name' => 'Doe',
            'email' => 'john.doe@example.com',
            'password' => Hash::make('password123'),
            'is_active' => true,
        ]);

        // Assign patient role
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
            'guardian_name' => 'Jane Doe',
            'guardian_phone' => '+1234567891',
            'emergency_contact' => '+1234567891',
            'allergies' => 'Penicillin, Nuts',
            'medical_conditions' => 'Hypertension, Diabetes Type 2',
        ]);

        // Find or create a doctor
        $doctor = User::role('doctor')->first();
        if (!$doctor) {
            $doctor = User::create([
                'first_name' => 'Dr. Sarah',
                'last_name' => 'Smith',
                'email' => 'dr.sarah@hospital.com',
                'password' => Hash::make('password123'),
                'is_active' => true,
            ]);
            $doctor->assignRole('doctor');
        }

        // Create some inventory items for medications
        $medications = [
            [
                'name' => 'Metformin',
                'brand_name' => 'Glucophage',
                'generic_name' => 'Metformin HCl',
                'category' => 'Diabetes Medication',
                'quantity_in_stock' => 100,
                'unit_price' => 25.50,
                'reorder_level' => 10,
            ],
            [
                'name' => 'Lisinopril',
                'brand_name' => 'Prinivil',
                'generic_name' => 'Lisinopril',
                'category' => 'Blood Pressure Medication',
                'quantity_in_stock' => 75,
                'unit_price' => 18.75,
                'reorder_level' => 15,
            ],
            [
                'name' => 'Aspirin',
                'brand_name' => 'Bayer',
                'generic_name' => 'Acetylsalicylic Acid',
                'category' => 'Pain Relief',
                'quantity_in_stock' => 200,
                'unit_price' => 5.25,
                'reorder_level' => 20,
            ]
        ];

        foreach ($medications as $med) {
            InventoryItem::firstOrCreate(
                ['name' => $med['name']],
                $med
            );
        }

        // Create prescriptions with prescription items
        $prescription1 = Prescription::create([
            'prescription_number' => 'RX-' . date('Y') . '-001',
            'patient_id' => $patient->id,
            'doctor_id' => $doctor->id,
            'prescription_date' => now()->subDays(7),
            'status' => 'dispensed',
            'notes' => 'For diabetes management',
        ]);

        // Add prescription items
        $metformin = InventoryItem::where('name', 'Metformin')->first();
        if ($metformin) {
            PrescriptionItem::create([
                'prescription_id' => $prescription1->id,
                'inventory_item_id' => $metformin->id,
                'quantity' => 30,
                'dosage' => '500mg',
                'frequency' => 'Twice daily',
                'duration_days' => 30,
                'instructions' => 'Take with meals',
                'unit_price' => $metformin->unit_price,
                'total_price' => $metformin->unit_price * 30,
                'is_dispensed' => true,
            ]);
        }

        $prescription2 = Prescription::create([
            'prescription_number' => 'RX-' . date('Y') . '-002',
            'patient_id' => $patient->id,
            'doctor_id' => $doctor->id,
            'prescription_date' => now()->subDays(14),
            'status' => 'dispensed',
            'notes' => 'For hypertension control',
        ]);

        $lisinopril = InventoryItem::where('name', 'Lisinopril')->first();
        if ($lisinopril) {
            PrescriptionItem::create([
                'prescription_id' => $prescription2->id,
                'inventory_item_id' => $lisinopril->id,
                'quantity' => 30,
                'dosage' => '10mg',
                'frequency' => 'Once daily',
                'duration_days' => 30,
                'instructions' => 'Take in the morning',
                'unit_price' => $lisinopril->unit_price,
                'total_price' => $lisinopril->unit_price * 30,
                'is_dispensed' => true,
            ]);
        }

        $prescription3 = Prescription::create([
            'prescription_number' => 'RX-' . date('Y') . '-003',
            'patient_id' => $patient->id,
            'doctor_id' => $doctor->id,
            'prescription_date' => now()->subDays(2),
            'status' => 'pending',
            'notes' => 'For pain relief',
        ]);

        $aspirin = InventoryItem::where('name', 'Aspirin')->first();
        if ($aspirin) {
            PrescriptionItem::create([
                'prescription_id' => $prescription3->id,
                'inventory_item_id' => $aspirin->id,
                'quantity' => 10,
                'dosage' => '325mg',
                'frequency' => 'As needed',
                'duration_days' => 10,
                'instructions' => 'Take with food if stomach upset occurs',
                'unit_price' => $aspirin->unit_price,
                'total_price' => $aspirin->unit_price * 10,
                'is_dispensed' => false,
            ]);
        }

        // Create clinic referrals
        $cardiology = Clinic::where('name', 'Cardiology Clinic')->first();
        if ($cardiology) {
            ClinicReferral::create([
                'patient_id' => $patient->id,
                'doctor_id' => $doctor->id,
                'clinic_id' => $cardiology->id,
                'reason' => 'Hypertension management and cardiac evaluation',
                'priority' => 'medium',
                'status' => 'pending',
                'preferred_appointment_date' => now()->addDays(7),
                'notes' => 'Patient has history of hypertension, needs specialist consultation',
            ]);
        }

        $endocrinology = Clinic::where('name', 'Endocrinology Clinic')->first();
        if ($endocrinology) {
            ClinicReferral::create([
                'patient_id' => $patient->id,
                'doctor_id' => $doctor->id,
                'clinic_id' => $endocrinology->id,
                'reason' => 'Diabetes management and glucose control optimization',
                'priority' => 'high',
                'status' => 'completed',
                'preferred_appointment_date' => now()->subDays(3),
                'notes' => 'Patient needs adjustment of diabetes medication',
            ]);
        }

        // Create another patient for testing
        $patient2 = User::create([
            'first_name' => 'Mary',
            'last_name' => 'Johnson',
            'email' => 'mary.johnson@example.com',
            'password' => Hash::make('password123'),
            'is_active' => true,
        ]);

        $patient2->assignRole('patient');

        PatientProfile::create([
            'user_id' => $patient2->id,
            'phone' => '+9876543210',
            'date_of_birth' => '1985-12-22',
            'gender' => 'female',
            'address' => '456 Oak Avenue',
            'city' => 'Los Angeles',
            'state' => 'CA',
            'blood_type' => 'A+',
            'guardian_name' => null,
            'guardian_phone' => null,
            'emergency_contact' => '+9876543211',
            'allergies' => 'Shellfish',
            'medical_conditions' => 'Asthma',
        ]);

        // Add prescription for Mary
        $prescription4 = Prescription::create([
            'prescription_number' => 'RX-' . date('Y') . '-004',
            'patient_id' => $patient2->id,
            'doctor_id' => $doctor->id,
            'prescription_date' => now()->subDays(1),
            'status' => 'pending',
            'notes' => 'Asthma inhaler refill',
        ]);

        // Create an inhaler inventory item if it doesn't exist
        $inhaler = InventoryItem::firstOrCreate(
            ['name' => 'Albuterol Inhaler'],
            [
                'brand_name' => 'ProAir HFA',
                'generic_name' => 'Albuterol Sulfate',
                'category' => 'Respiratory Medication',
                'quantity_in_stock' => 50,
                'unit_price' => 45.00,
                'reorder_level' => 5,
            ]
        );

        PrescriptionItem::create([
            'prescription_id' => $prescription4->id,
            'inventory_item_id' => $inhaler->id,
            'quantity' => 1,
            'dosage' => '90 mcg',
            'frequency' => '2 puffs as needed',
            'duration_days' => 30,
            'instructions' => 'Use for asthma symptoms. Rinse mouth after use.',
            'unit_price' => $inhaler->unit_price,
            'total_price' => $inhaler->unit_price,
            'is_dispensed' => false,
        ]);

        $this->command->info('Sample patient data created successfully!');
        $this->command->info('Test phone numbers:');
        $this->command->info('- John Doe: +1234567890');
        $this->command->info('- Mary Johnson: +9876543210');
    }
}