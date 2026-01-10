<?php

namespace Database\Seeders;

use App\Models\PatientProfile;
use App\Models\QueueEntry;
use App\Models\Role;
use App\Models\User;
use Faker\Factory as FakerFactory;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Spatie\Permission\Models\Role as SpatieRole;

class ResetOpdTestDataSeeder extends Seeder
{
    public function run(): void
    {
        DB::transaction(function () {
            Schema::disableForeignKeyConstraints();

            QueueEntry::query()->delete();
            DB::table('appointments')->delete();

            $patientRole = SpatieRole::findByName('patient', 'sanctum');
            if ($patientRole) {
                $patientUserIds = DB::table('model_has_roles')
                    ->where('role_id', $patientRole->id)
                    ->where('model_type', User::class)
                    ->pluck('model_id');

                PatientProfile::query()->whereIn('user_id', $patientUserIds)->delete();
                User::query()->whereIn('id', $patientUserIds)->delete();
            }

            Schema::enableForeignKeyConstraints();
        });

        $faker = FakerFactory::create();

        $count = 25;

        for ($i = 0; $i < $count; $i++) {
            $firstName = $faker->firstName();
            $lastName = $faker->lastName();

            $email = $faker->unique()->safeEmail();

            $baseUsername = strtolower(preg_replace('/[^a-z0-9]+/i', '', $firstName . $lastName));
            $username = $baseUsername !== '' ? $baseUsername : 'patient';
            $suffix = 1;
            while (User::query()->where('username', $username)->exists()) {
                $username = $baseUsername . $suffix;
                $suffix++;
            }

            $user = User::create([
                'first_name' => $firstName,
                'last_name' => $lastName,
                'username' => $username,
                'email' => $email,
                'password' => Hash::make('patient123'),
                'is_active' => true,
            ]);

            $user->assignRole('patient');

            $patientCode = 'P' . str_pad((string) ($i + 1), 5, '0', STR_PAD_LEFT);
            while (PatientProfile::query()->where('patient_id', $patientCode)->exists()) {
                $patientCode = 'P' . str_pad((string) $faker->numberBetween(1, 99999), 5, '0', STR_PAD_LEFT);
            }

            PatientProfile::create([
                'user_id' => $user->id,
                'patient_id' => $patientCode,
                'phone' => $faker->numerify('07########'),
                'age' => $faker->numberBetween(1, 90),
                'date_of_birth' => $faker->date('Y-m-d', '-10 years'),
                'gender' => $faker->randomElement(['male', 'female']),
                'address' => $faker->address(),
                'city' => $faker->city(),
                'state' => $faker->state(),
                'postal_code' => $faker->postcode(),
                'guardian_name' => $faker->name(),
                'guardian_email' => $faker->safeEmail(),
                'guardian_phone' => $faker->numerify('07########'),
                'guardian_relationship' => $faker->randomElement(['parent', 'spouse', 'sibling', 'other']),
            ]);
        }
    }
}
