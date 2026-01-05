<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;

class VerifyUserRolesSeeder extends Seeder
{
    public function run(): void
    {
        $users = User::with('roles')->get();
        
        foreach ($users as $user) {
            $roles = $user->roles->pluck('name')->join(',');
            $this->command->info("User: {$user->email} - Roles: {$roles}");
        }
    }
}
