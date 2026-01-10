<?php

namespace Database\Seeders;

use App\Models\PatientProfile;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Spatie\Permission\Models\Role as SpatieRole;

class ClearAllPatientsSeeder extends Seeder
{
    public function run(): void
    {
        DB::transaction(function () {
            Schema::disableForeignKeyConstraints();

            $patientRole = SpatieRole::findByName('patient', 'sanctum');
            if ($patientRole) {
                // Exclude the default seeded patient by email
                $patientUserIds = DB::table('model_has_roles')
                    ->where('role_id', $patientRole->id)
                    ->where('model_type', User::class)
                    ->pluck('model_id');

                $excludeUserId = User::where('email', 'patient@mediclinic.com')->value('id');
                if ($excludeUserId) {
                    $patientUserIds = $patientUserIds->reject(fn($id) => $id === $excludeUserId);
                }

                PatientProfile::query()->whereIn('user_id', $patientUserIds)->delete();
                User::query()->whereIn('id', $patientUserIds)->delete();
            }

            Schema::enableForeignKeyConstraints();
        });

        $this->command->info('Cleared all patient users (except default patient@mediclinic.com) and their profiles.');
    }
}
