<?php

namespace Database\Seeders;

use App\Models\Clinic;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class ClinicSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        $clinics = [
            ['name' => 'General Medicine Clinic', 'location' => 'Building A, Floor 1', 'department_type' => 'General Medicine'],
            ['name' => 'Cardiology Clinic', 'location' => 'Building B, Floor 2', 'department_type' => 'Cardiology'],
            ['name' => 'Orthopedic Clinic', 'location' => 'Building C, Floor 1', 'department_type' => 'Orthopedics'],
            ['name' => 'Obstetrics & Gynecology (OB-GYN) Clinic', 'location' => 'Building A, Floor 3', 'department_type' => 'OB-GYN'],
            ['name' => 'Pediatrics Clinic', 'location' => 'Building B, Floor 1', 'department_type' => 'Pediatrics'],
            ['name' => 'General Surgery Clinic', 'location' => 'Building D, Floor 2', 'department_type' => 'Surgery'],
            ['name' => 'Dermatology Clinic', 'location' => 'Building A, Floor 2', 'department_type' => 'Dermatology'],
            ['name' => 'ENT (Ear, Nose & Throat) Clinic', 'location' => 'Building C, Floor 2', 'department_type' => 'ENT'],
            ['name' => 'Ophthalmology (Eye) Clinic', 'location' => 'Building B, Floor 3', 'department_type' => 'Ophthalmology'],
            ['name' => 'Neurology Clinic', 'location' => 'Building D, Floor 3', 'department_type' => 'Neurology'],
            ['name' => 'Psychiatry & Mental Health Clinic', 'location' => 'Building E, Floor 1', 'department_type' => 'Psychiatry'],
            ['name' => 'Emergency Medicine Clinic', 'location' => 'Building F, Ground Floor', 'department_type' => 'Emergency'],
            ['name' => 'Radiology & Imaging Clinic', 'location' => 'Building A, Basement', 'department_type' => 'Radiology'],
            ['name' => 'Laboratory Services Clinic', 'location' => 'Building A, Basement', 'department_type' => 'Laboratory'],
            ['name' => 'Physical Therapy Clinic', 'location' => 'Building E, Floor 2', 'department_type' => 'Physical Therapy'],
        ];

        foreach ($clinics as $clinic) {
            Clinic::updateOrCreate(
                ['name' => $clinic['name']],
                $clinic
            );
        }
    }
}
