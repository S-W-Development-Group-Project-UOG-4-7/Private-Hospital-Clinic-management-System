<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class CreateDoctorUserSeeder2 extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $user = new User();
        $user->first_name = 'John';
        $user->last_name = 'Doe';
        $user->username = 'johndoe';
        $user->email = 'doctor@example.com';
        $user->password = Hash::make('password');
        $user->save();
        
        $this->command->info('Doctor user created with ID: ' . $user->id);
    }
}
