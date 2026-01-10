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
            $table->foreignId('patient_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('referred_by_doctor_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('referred_to_doctor_id')->nullable()->constrained('users')->nullOnDelete();
            $table->enum('type', ['internal', 'external'])->default('internal');
            $table->string('external_provider')->nullable();
            $table->text('reason')->nullable();
            $table->enum('status', ['pending', 'accepted', 'completed', 'cancelled'])->default('pending');
            $table->date('referred_at')->nullable();
            $table->text('notes')->nullable();
            $table->string('report_url')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index('patient_id');
            $table->index('type');
            $table->index('status');
            $table->index('referred_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('referrals');
    }
};
