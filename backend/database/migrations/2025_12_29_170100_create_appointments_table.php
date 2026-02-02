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
        Schema::create('appointments', function (Blueprint $table) {
            $table->id();
            
            // Relationships
            $table->foreignId('patient_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('doctor_id')->nullable()->constrained('users')->nullOnDelete();
            
            // --- ADDED THIS CRITICAL COLUMN ---
            $table->foreignId('department_id')->nullable()->constrained('departments')->nullOnDelete();

            // Appointment Details
            $table->date('appointment_date');
            $table->time('appointment_time'); // Keep time separate as per your code
            
            // --- ADDED MISSING COLUMNS EXPECTED BY CONTROLLERS ---
            $table->string('clinic')->default('OPD');
            $table->string('appointment_number')->nullable();
            $table->boolean('is_walk_in')->default(false);
            $table->timestamp('confirmed_at')->nullable();

            // Status & Type
            $table->enum('type', ['in_person', 'telemedicine'])->default('in_person');
            // Added 'Checked-In' to status options just in case
            $table->string('status')->default('Scheduled'); 
            
            $table->text('reason')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            // Indexes for performance
            $table->index('patient_id');
            $table->index('doctor_id');
            $table->index('department_id'); // Added index
            $table->index('appointment_date');
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('appointments');
    }
};