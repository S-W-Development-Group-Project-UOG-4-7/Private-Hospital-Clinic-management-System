<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('teleconsultations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('patient_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('doctor_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('scheduled_at');
            $table->enum('status', ['scheduled', 'completed', 'cancelled'])->default('scheduled');
            $table->string('meeting_url')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index('patient_id');
            $table->index('doctor_id');
            $table->index('scheduled_at');
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('teleconsultations');
    }
};
