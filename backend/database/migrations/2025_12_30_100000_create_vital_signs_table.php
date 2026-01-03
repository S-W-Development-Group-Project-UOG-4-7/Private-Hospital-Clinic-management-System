<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('vital_signs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('patient_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('doctor_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('appointment_id')->nullable()->constrained('appointments')->nullOnDelete();
            $table->decimal('blood_pressure_systolic', 5, 2)->nullable();
            $table->decimal('blood_pressure_diastolic', 5, 2)->nullable();
            $table->integer('heart_rate')->nullable();
            $table->decimal('temperature', 5, 2)->nullable();
            $table->decimal('weight', 6, 2)->nullable();
            $table->decimal('height', 6, 2)->nullable();
            $table->integer('respiratory_rate')->nullable();
            $table->decimal('oxygen_saturation', 5, 2)->nullable();
            $table->text('symptoms')->nullable();
            $table->text('notes')->nullable();
            $table->timestamp('recorded_at')->useCurrent();
            $table->timestamps();

            $table->index('patient_id');
            $table->index('doctor_id');
            $table->index('appointment_id');
            $table->index('recorded_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vital_signs');
    }
};

