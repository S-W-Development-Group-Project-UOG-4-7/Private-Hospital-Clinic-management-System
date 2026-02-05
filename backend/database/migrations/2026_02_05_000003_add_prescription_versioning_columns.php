<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('prescriptions', function (Blueprint $table) {
            if (!Schema::hasColumn('prescriptions', 'appointment_id')) {
                $table->foreignId('appointment_id')->nullable()->after('clinic_id')->constrained('appointments')->nullOnDelete();
            }
            if (!Schema::hasColumn('prescriptions', 'root_prescription_id')) {
                $table->foreignId('root_prescription_id')->nullable()->after('appointment_id')->constrained('prescriptions')->nullOnDelete();
            }
            if (!Schema::hasColumn('prescriptions', 'previous_prescription_id')) {
                $table->foreignId('previous_prescription_id')->nullable()->after('root_prescription_id')->constrained('prescriptions')->nullOnDelete();
            }
            if (!Schema::hasColumn('prescriptions', 'version')) {
                $table->unsignedInteger('version')->default(1)->after('previous_prescription_id');
            }
        });
    }

    public function down(): void
    {
        Schema::table('prescriptions', function (Blueprint $table) {
            if (Schema::hasColumn('prescriptions', 'version')) {
                $table->dropColumn('version');
            }
            if (Schema::hasColumn('prescriptions', 'previous_prescription_id')) {
                $table->dropForeign(['previous_prescription_id']);
                $table->dropColumn('previous_prescription_id');
            }
            if (Schema::hasColumn('prescriptions', 'root_prescription_id')) {
                $table->dropForeign(['root_prescription_id']);
                $table->dropColumn('root_prescription_id');
            }
            if (Schema::hasColumn('prescriptions', 'appointment_id')) {
                $table->dropForeign(['appointment_id']);
                $table->dropColumn('appointment_id');
            }
        });
    }
};
