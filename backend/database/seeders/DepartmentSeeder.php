<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Department;

class DepartmentSeeder extends Seeder
{
    public function run(): void
    {
        // define the departments
        $departments = [
            ['name' => 'Cardiology', 'description' => 'Heart and cardiovascular system'],
            ['name' => 'Neurology', 'description' => 'Nervous system disorders'],
            ['name' => 'Pediatrics', 'description' => 'Medical care for infants and children'],
            ['name' => 'Orthopedics', 'description' => 'Bones and muscles'],
            ['name' => 'General Surgery', 'description' => 'Surgical procedures'],
        ];

        // Loop through and save them one by one
        foreach ($departments as $dept) {
            Department::firstOrCreate(['name' => $dept['name']], $dept);
        }
    }
}