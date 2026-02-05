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
        Schema::create('prescriptions', function (Blueprint $table) {
            $table->id();
            $table->string('prescription_number')->unique();
            $table->foreignId('patient_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('doctor_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('pharmacist_id')->nullable()->constrained('users')->nullOnDelete();
            $table->date('prescription_date');
            $table->enum('status', ['pending', 'processing', 'dispensed', 'cancelled'])->default('pending');
            $table->text('notes')->nullable();
            $table->text('instructions')->nullable();
            $table->timestamp('dispensed_at')->nullable();
            $table->timestamps();
            
            $table->index('prescription_number');
            $table->index('patient_id');
            $table->index('status');
            $table->index('prescription_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('prescriptions');
    }
};
