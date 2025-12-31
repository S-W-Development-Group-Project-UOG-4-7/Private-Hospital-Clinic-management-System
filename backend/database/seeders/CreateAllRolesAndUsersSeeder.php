<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class CreateAllRolesAndUsersSeeder extends Seeder
{
    public function run(): void
    {
        // Create roles
        $roles = [
            ['name' => 'admin', 'guard_name' => 'web'],
            ['name' => 'doctor', 'guard_name' => 'web'],
            ['name' => 'receptionist', 'guard_name' => 'web'],
            ['name' => 'pharmacist', 'guard_name' => 'web'],
            ['name' => 'patient', 'guard_name' => 'web'],
        ];

        foreach ($roles as $role) {
            DB::table('roles')->updateOrInsert(
                ['name' => $role['name']],
                $role + ['created_at' => now(), 'updated_at' => now()]
            );
        }

        // Create users for each role
        $users = [
            [
                'first_name' => 'Admin',
                'last_name' => 'User',
                'username' => 'admin',
                'email' => 'admin@example.com',
                'password' => Hash::make('password'),
                'role' => 'admin',
            ],
            [
                'first_name' => 'John',
                'last_name' => 'Doe',
                'username' => 'johndoe',
                'email' => 'doctor@example.com',
                'password' => Hash::make('password'),
                'role' => 'doctor',
            ],
            [
                'first_name' => 'Jane',
                'last_name' => 'Smith',
                'username' => 'janesmith',
                'email' => 'receptionist@example.com',
                'password' => Hash::make('password'),
                'role' => 'receptionist',
            ],
            [
                'first_name' => 'Mike',
                'last_name' => 'Wilson',
                'username' => 'mikewilson',
                'email' => 'pharmacist@example.com',
                'password' => Hash::make('password'),
                'role' => 'pharmacist',
            ],
            [
                'first_name' => 'Sarah',
                'last_name' => 'Johnson',
                'username' => 'sarahjohnson',
                'email' => 'patient@example.com',
                'password' => Hash::make('password'),
                'role' => 'patient',
            ],
        ];

        foreach ($users as $userData) {
            $role = $userData['role'];
            unset($userData['role']); // Remove role from user data array
            
            $user = User::updateOrCreate(
                ['email' => $userData['email']],
                $userData
            );
            $user->assignRole($role);
            
            $this->command->info("Created {$role} user: {$userData['email']}");
        }

        $this->command->info('All roles and users created successfully!');
    }
}
