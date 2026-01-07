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

        // Create roles for both 'web' and 'sanctum' guards
        $roleIds = $roleSlugs->mapWithKeys(function (string $roleName) {
            // Create role for web guard (for web routes)
            Role::findOrCreate($roleName, 'web');
            // Create role for sanctum guard (for API routes)
            $role = Role::findOrCreate($roleName, 'sanctum');
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

        $adminEmail = 'admin@mediclinic.com';
        $adminUsername = User::where('email', $adminEmail)->value('username') ?: (User::where('username', 'admin')->exists() ? $makeUniqueUsername('admin') : 'admin');

        // Admin user
        $admin = User::updateOrCreate(
            ['email' => $adminEmail],
            [
                'first_name' => 'System',
                'last_name' => 'Administrator',
                'username' => $adminUsername,
                'password' => Hash::make('admin123'),
                'role_id' => $roleIds['admin'] ?? null,
            ]
        );
        $admin->syncRoles(['admin']);

        // Doctor user
        $doctorEmail = 'doctor@mediclinic.com';
        $doctorUsername = User::where('email', $doctorEmail)->value('username') ?: (User::where('username', 'doctor')->exists() ? $makeUniqueUsername('doctor') : 'doctor');

        $doctor = User::updateOrCreate(
            ['email' => $doctorEmail],
            [
                'first_name' => 'Dr. John',
                'last_name' => 'Smith',
                'username' => $doctorUsername,
                'password' => Hash::make('doctor123'),
                'role_id' => $roleIds['doctor'] ?? null,
            ]
        );
        $doctor->syncRoles(['doctor']);

        // Pharmacist user
        $pharmacistEmail = 'pharmacist@mediclinic.com';
        $pharmacistUsername = User::where('email', $pharmacistEmail)->value('username') ?: (User::where('username', 'pharmacist')->exists() ? $makeUniqueUsername('pharmacist') : 'pharmacist');

        $pharmacist = User::updateOrCreate(
            ['email' => $pharmacistEmail],
            [
                'first_name' => 'Sarah',
                'last_name' => 'Johnson',
                'username' => $pharmacistUsername,
                'password' => Hash::make('pharmacist123'),
                'role_id' => $roleIds['pharmacist'] ?? null,
            ]
        );
        $pharmacist->syncRoles(['pharmacist']);

        // Receptionist user
        $receptionistEmail = 'receptionist@mediclinic.com';
        $receptionistUsername = User::where('email', $receptionistEmail)->value('username') ?: (User::where('username', 'receptionist')->exists() ? $makeUniqueUsername('receptionist') : 'receptionist');

        $receptionist = User::updateOrCreate(
            ['email' => $receptionistEmail],
            [
                'first_name' => 'Emily',
                'last_name' => 'Brown',
                'username' => $receptionistUsername,
                'password' => Hash::make('receptionist123'),
                'role_id' => $roleIds['receptionist'] ?? null,
            ]
        );
        $receptionist->syncRoles(['receptionist']);

        // Patient user
        $patientEmail = 'patient@mediclinic.com';
        $patientUsername = User::where('email', $patientEmail)->value('username') ?: (User::where('username', 'patient')->exists() ? $makeUniqueUsername('patient') : 'patient');

        $patient = User::updateOrCreate(
            ['email' => $patientEmail],
            [
                'first_name' => 'John',
                'last_name' => 'Wilson',
                'username' => $patientUsername,
                'password' => Hash::make('patient123'),
                'role_id' => $roleIds['patient'] ?? null,
            ]
        );
        $patient->syncRoles(['patient']);

        // Seed default clinics
        $this->call([\Database\Seeders\ClinicSeeder::class]);
    }
}
