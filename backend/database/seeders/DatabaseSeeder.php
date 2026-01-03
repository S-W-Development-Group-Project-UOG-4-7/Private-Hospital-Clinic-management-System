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

        // Doctor user
        $doctorEmail = 'doctor@example.com';
        $doctorUsername = User::where('email', $doctorEmail)->value('username') ?: (User::where('username', 'doctor')->exists() ? $makeUniqueUsername('doctor') : 'doctor');

        $doctor = User::updateOrCreate(
            ['email' => $doctorEmail],
            [
                'first_name' => 'Dr. John',
                'last_name' => 'Smith',
                'username' => $doctorUsername,
                'password' => Hash::make('Doctor@123'),
                'role_id' => $roleIds['doctor'] ?? null,
            ]
        );

        $doctor->syncRoles(['doctor']);

        // Pharmacist user
        $pharmacistEmail = 'pharmacist@example.com';
        $pharmacistUsername = User::where('email', $pharmacistEmail)->value('username') ?: (User::where('username', 'pharmacist')->exists() ? $makeUniqueUsername('pharmacist') : 'pharmacist');

        $pharmacist = User::updateOrCreate(
            ['email' => $pharmacistEmail],
            [
                'first_name' => 'Pharmacy',
                'last_name' => 'Manager',
                'username' => $pharmacistUsername,
                'password' => Hash::make('Pharmacist@123'),
                'role_id' => $roleIds['pharmacist'] ?? null,
            ]
        );

        $pharmacist->syncRoles(['pharmacist']);

        // Receptionist user
        $receptionistEmail = 'receptionist@example.com';
        $receptionistUsername = User::where('email', $receptionistEmail)->value('username') ?: (User::where('username', 'receptionist')->exists() ? $makeUniqueUsername('receptionist') : 'receptionist');

        $receptionist = User::updateOrCreate(
            ['email' => $receptionistEmail],
            [
                'first_name' => 'Reception',
                'last_name' => 'Staff',
                'username' => $receptionistUsername,
                'password' => Hash::make('Receptionist@123'),
                'role_id' => $roleIds['receptionist'] ?? null,
            ]
        );

        $receptionist->syncRoles(['receptionist']);

        // Seed default clinics
        $this->call([\Database\Seeders\ClinicSeeder::class]);
    }
}
