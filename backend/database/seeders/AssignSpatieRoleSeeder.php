<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;

class AssignSpatieRoleSeeder extends Seeder
{
    public function run(): void
    {
        $user = User::find(4);
        $user->assignRole('doctor');
        
        $this->command->info('Doctor role assigned using Spatie package');
    }
}
