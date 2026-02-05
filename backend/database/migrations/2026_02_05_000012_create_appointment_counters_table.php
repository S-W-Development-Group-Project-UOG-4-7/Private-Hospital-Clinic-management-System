<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('appointment_counters', function (Blueprint $table) {
            $table->date('appointment_date')->primary();
            $table->unsignedInteger('last_number');
            $table->timestamps();
        });

        if (DB::connection()->getDriverName() === 'pgsql') {
            DB::statement("
                INSERT INTO appointment_counters (appointment_date, last_number, created_at, updated_at)
                SELECT appointment_date, MAX(appointment_number::int), NOW(), NOW()
                FROM appointments
                WHERE appointment_number::text ~ '^[0-9]+$'
                GROUP BY appointment_date
                ON CONFLICT (appointment_date) DO NOTHING
            ");
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('appointment_counters');
    }
};
