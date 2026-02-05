<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('referrals', function (Blueprint $table) {
            $table->id();
            $table->string('referral_number')->unique();
            $table->foreignId('patient_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('referring_doctor_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('referred_doctor_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('specialty')->nullable();
            $table->enum('status', ['pending', 'accepted', 'completed', 'cancelled'])->default('pending');
            $table->text('reason')->nullable();
            $table->text('clinical_summary')->nullable();
            $table->text('notes')->nullable();
            $table->date('referral_date');
            $table->date('appointment_date')->nullable();
            $table->timestamp('accepted_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            $table->index('referral_number');
            $table->index('patient_id');
            $table->index('referring_doctor_id');
            $table->index('referred_doctor_id');
            $table->index('status');
            $table->index('referral_date');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('referrals');
    }
};

