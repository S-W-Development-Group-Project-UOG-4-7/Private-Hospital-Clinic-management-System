<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class CreateDoctorRoleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::table('roles')->insert([
            'name' => 'doctor',
            'guard_name' => 'web',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        
        $this->command->info('Doctor role created');
    }
}
