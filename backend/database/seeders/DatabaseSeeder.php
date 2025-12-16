<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Role;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $roles = collect([
            'Admin',
            'Doctor',
            'Receptionist',
            'Pharmacist',
            'Patient',
        ])->mapWithKeys(function (string $name) {
            $slug = Str::slug($name);
            $role = Role::firstOrCreate(
                ['slug' => $slug],
                ['name' => $name]
            );

            return [$slug => $role->id];
        });

        User::factory()->create([
            'first_name' => 'System',
            'last_name' => 'Admin',
            'username' => 'admin',
            'email' => 'admin@example.com',
            'password' => Hash::make('Admin@123'),
            'role_id' => $roles['admin'] ?? null,
        ]);
    }
}
