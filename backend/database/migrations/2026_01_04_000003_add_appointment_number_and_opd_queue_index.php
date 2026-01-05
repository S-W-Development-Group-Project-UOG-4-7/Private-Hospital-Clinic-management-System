<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('appointments', function (Blueprint $table) {
            $table->unsignedInteger('appointment_number')->nullable()->after('doctor_id');
            $table->unique(['appointment_date', 'appointment_number'], 'appointments_date_number_unique');
        });

        DB::statement("CREATE UNIQUE INDEX IF NOT EXISTS queue_entries_opd_unique ON queue_entries(queue_date, queue_number) WHERE doctor_id IS NULL");
    }

    public function down(): void
    {
        DB::statement('DROP INDEX IF EXISTS queue_entries_opd_unique');

        Schema::table('appointments', function (Blueprint $table) {
            $table->dropUnique('appointments_date_number_unique');
            $table->dropColumn('appointment_number');
        });
    }
};
