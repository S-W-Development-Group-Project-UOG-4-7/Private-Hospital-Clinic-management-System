<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('patient_profiles', function (Blueprint $table) {
            if (!Schema::hasColumn('patient_profiles', 'nic_passport')) {
                $table->string('nic_passport', 50)->nullable()->after('address');
            }
            if (!Schema::hasColumn('patient_profiles', 'emergency_contact_name')) {
                $table->string('emergency_contact_name')->nullable()->after('nic_passport');
            }
            if (!Schema::hasColumn('patient_profiles', 'emergency_contact_phone')) {
                $table->string('emergency_contact_phone', 50)->nullable()->after('emergency_contact_name');
            }
            if (!Schema::hasColumn('patient_profiles', 'emergency_contact_relationship')) {
                $table->string('emergency_contact_relationship', 100)->nullable()->after('emergency_contact_phone');
            }
        });
    }

    public function down(): void
    {
        Schema::table('patient_profiles', function (Blueprint $table) {
            if (Schema::hasColumn('patient_profiles', 'emergency_contact_relationship')) {
                $table->dropColumn('emergency_contact_relationship');
            }
            if (Schema::hasColumn('patient_profiles', 'emergency_contact_phone')) {
                $table->dropColumn('emergency_contact_phone');
            }
            if (Schema::hasColumn('patient_profiles', 'emergency_contact_name')) {
                $table->dropColumn('emergency_contact_name');
            }
            if (Schema::hasColumn('patient_profiles', 'nic_passport')) {
                $table->dropColumn('nic_passport');
            }
        });
    }
};
