<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('diagnoses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('patient_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('doctor_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('appointment_id')->nullable()->constrained('appointments')->nullOnDelete();
            $table->string('icd10_code')->nullable();
            $table->string('icd10_description')->nullable();
            $table->string('diagnosis_name');
            $table->text('description')->nullable();
            $table->enum('status', ['active', 'resolved', 'chronic'])->default('active');
            $table->date('diagnosis_date');
            $table->date('resolved_date')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index('patient_id');
            $table->index('doctor_id');
            $table->index('appointment_id');
            $table->index('icd10_code');
            $table->index('status');
            $table->index('diagnosis_date');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('diagnoses');
    }
};

