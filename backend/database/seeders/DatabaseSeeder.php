<?php

namespace Database\Seeders;

use App\Models\Clinic;
use App\Models\Department;
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

        $this->call([
            \Database\Seeders\PermissionsSeeder::class,
        ]);

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
                'phone' => '0711234567',
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

        // Seed default clinics and departments
        $this->call([
            \Database\Seeders\ClinicSeeder::class,
            \Database\Seeders\DepartmentSeeder::class,
            \Database\Seeders\AddSupplierSeeder::class,
            \Database\Seeders\AddMedicineInventorySeeder::class,
            \Database\Seeders\DemoDataSeeder::class,
        ]);

        $departmentMap = Department::query()
            ->whereIn('name', ['OPD', 'Cardiology', 'Neurology', 'Pediatrics', 'Orthopedics', 'General Surgery'])
            ->pluck('id', 'name');
        $clinicMap = Clinic::query()
            ->pluck('id', 'department_type');

        $doctorSeeds = [
            [
                'email' => 'cardiology@mediclinic.com',
                'first_name' => 'Amal',
                'last_name' => 'Perera',
                'phone' => '0712001001',
                'department' => 'Cardiology',
                'clinic_type' => 'Cardiology',
            ],
            [
                'email' => 'neurology@mediclinic.com',
                'first_name' => 'Nimasha',
                'last_name' => 'Silva',
                'phone' => '0712001002',
                'department' => 'Neurology',
                'clinic_type' => 'Neurology',
            ],
            [
                'email' => 'pediatrics@mediclinic.com',
                'first_name' => 'Shehani',
                'last_name' => 'Fernando',
                'phone' => '0712001003',
                'department' => 'Pediatrics',
                'clinic_type' => 'Pediatrics',
            ],
            [
                'email' => 'orthopedics@mediclinic.com',
                'first_name' => 'Ravi',
                'last_name' => 'Jayasuriya',
                'phone' => '0712001004',
                'department' => 'Orthopedics',
                'clinic_type' => 'Orthopedics',
            ],
            [
                'email' => 'surgery@mediclinic.com',
                'first_name' => 'Mala',
                'last_name' => 'Wijesinghe',
                'phone' => '0712001005',
                'department' => 'General Surgery',
                'clinic_type' => 'Surgery',
            ],
            [
                'email' => 'opd@mediclinic.com',
                'first_name' => 'Ishara',
                'last_name' => 'Senanayake',
                'phone' => '0712001006',
                'department' => 'OPD',
                'clinic_type' => 'General Medicine',
            ],
        ];

        foreach ($doctorSeeds as $seed) {
            $existing = User::where('email', $seed['email'])->first();
            $baseUsername = strtolower(preg_replace('/\s+/', '', $seed['first_name'] . $seed['last_name']));
            $username = $existing?->username ?: (User::where('username', $baseUsername)->exists() ? $makeUniqueUsername($baseUsername) : $baseUsername);

            $departmentId = $departmentMap[$seed['department']] ?? null;
            $clinicId = $clinicMap[$seed['clinic_type']] ?? null;

            $user = User::updateOrCreate(
                ['email' => $seed['email']],
                [
                    'first_name' => $seed['first_name'],
                    'last_name' => $seed['last_name'],
                    'username' => $username,
                    'email' => $seed['email'],
                    'phone' => $seed['phone'],
                    'password' => Hash::make('doctor123'),
                    'role_id' => $roleIds['doctor'] ?? null,
                    'department_id' => $departmentId,
                    'clinic_id' => $clinicId,
                ]
            );
            $user->syncRoles(['doctor']);
        }

        $defaultDepartmentId = Department::query()
            ->where('name', 'OPD')
            ->value('id') ?? Department::query()->orderBy('id')->value('id');

        if ($defaultDepartmentId) {
            $doctor = User::where('email', $doctorEmail)->first();
            if ($doctor && empty($doctor->department_id)) {
                $doctor->department_id = $defaultDepartmentId;
                $doctor->clinic_id = $doctor->clinic_id ?? ($clinicMap['General Medicine'] ?? null);
                $doctor->save();
            }
        }
    }
}
