<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Add clinic_id to prescriptions table
        Schema::table('prescriptions', function (Blueprint $table) {
            if (!Schema::hasColumn('prescriptions', 'clinic_id')) {
                $table->foreignId('clinic_id')->nullable()->after('doctor_id')->constrained('clinics')->nullOnDelete();
            }
        });

        // Add clinic_id to lab_orders table
        Schema::table('lab_orders', function (Blueprint $table) {
            if (!Schema::hasColumn('lab_orders', 'clinic_id')) {
                $table->foreignId('clinic_id')->nullable()->after('doctor_id')->constrained('clinics')->nullOnDelete();
            }
        });
    }

    public function down(): void
    {
        Schema::table('prescriptions', function (Blueprint $table) {
            if (Schema::hasColumn('prescriptions', 'clinic_id')) {
                $table->dropForeign(['clinic_id']);
                $table->dropColumn('clinic_id');
            }
        });

        Schema::table('lab_orders', function (Blueprint $table) {
            if (Schema::hasColumn('lab_orders', 'clinic_id')) {
                $table->dropForeign(['clinic_id']);
                $table->dropColumn('clinic_id');
            }
        });
    }
};
