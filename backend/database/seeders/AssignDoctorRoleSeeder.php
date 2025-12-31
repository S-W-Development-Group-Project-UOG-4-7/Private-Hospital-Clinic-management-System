<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;

class AssignDoctorRoleSeeder extends Seeder
{
    public function run(): void
    {
        $user = User::find(4);
        $user->role_id = 1; // doctor role ID
        $user->save();
        
        $this->command->info('Doctor role assigned to user ID 4');
    }
}
