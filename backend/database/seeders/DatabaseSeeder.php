<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $roleSlugs = collect([
            'admin',
            'doctor',
            'receptionist',
            'pharmacist',
            'patient',
        ]);

        $roleIds = $roleSlugs->mapWithKeys(function (string $roleName) {
            $role = Role::findOrCreate($roleName, 'web');
            return [$roleName => $role->id];
        });

        $makeUniqueUsername = function (string $base): string {
            $candidate = $base;
            $suffix = 1;
            while (User::where('username', $candidate)->exists()) {
                $candidate = $base . $suffix;
                $suffix++;
            }
            return $candidate;
        };

        $adminEmail = 'admin@example.com';
        $adminUsername = User::where('email', $adminEmail)->value('username') ?: (User::where('username', 'admin')->exists() ? $makeUniqueUsername('admin') : 'admin');

        $admin = User::updateOrCreate(
            ['email' => $adminEmail],
            [
                'first_name' => 'System',
                'last_name' => 'Admin',
                'username' => $adminUsername,
                'password' => Hash::make('Admin@123'),
                'role_id' => $roleIds['admin'] ?? null,
            ]
        );

        $admin->syncRoles(['admin']);

        $patientEmail = 'patient@example.com';
        $patientUsername = User::where('email', $patientEmail)->value('username') ?: (User::where('username', 'patient')->exists() ? $makeUniqueUsername('patient') : 'patient');

        $patient = User::updateOrCreate(
            ['email' => $patientEmail],
            [
                'first_name' => 'Test',
                'last_name' => 'Patient',
                'username' => $patientUsername,
                'password' => Hash::make('Patient@123'),
                'role_id' => $roleIds['patient'] ?? null,
            ]
        );

        $patient->syncRoles(['patient']);
    }
}
