<?php

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class CreateDoctorUserSeeder extends Seeder
{
    public function run()
    {
        $user = new User();
        $user->first_name = 'John';
        $user->last_name = 'Doe';
        $user->email = 'doctor@example.com';
        $user->password = Hash::make('password');
        $user->role_id = 2; // Assuming role_id 2 = doctor
        $user->save();
        
        $this->command->info('Doctor user created with ID: ' . $user->id);
    }
}
