<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('clinic_referrals', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('patient_id');
            $table->unsignedBigInteger('clinic_id');
            $table->unsignedBigInteger('referring_doctor_id');
            $table->text('reason');
            $table->text('clinical_summary')->nullable();
            $table->text('notes')->nullable();
            $table->enum('priority', ['low', 'medium', 'high', 'urgent'])->default('medium');
            $table->enum('status', ['pending', 'scheduled', 'completed', 'cancelled'])->default('pending');
            $table->dateTime('preferred_appointment_date')->nullable();
            $table->dateTime('scheduled_appointment_date')->nullable();
            $table->timestamps();

            $table->foreign('patient_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('clinic_id')->references('id')->on('clinics')->onDelete('cascade');
            $table->foreign('referring_doctor_id')->references('id')->on('users')->onDelete('cascade');
            
            $table->index(['patient_id', 'clinic_id']);
            $table->index('referring_doctor_id');
            $table->index('status');
            $table->index('priority');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('clinic_referrals');
    }
};
