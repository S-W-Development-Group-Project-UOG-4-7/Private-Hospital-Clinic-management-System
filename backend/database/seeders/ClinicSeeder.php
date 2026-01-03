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
            'OPD',
            'Pediatrics',
            'Obstetrics & Gynecology',
            'Dental Clinic',
            'Cardiology',
            'Orthopedics',
            'Dermatology',
            'Ophthalmology',
        ];

        foreach ($clinics as $name) {
            Clinic::updateOrCreate(
                ['name' => $name],
                ['name' => $name]
            );
        }
    }
}
