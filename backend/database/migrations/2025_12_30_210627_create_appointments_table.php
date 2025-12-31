<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('appointments', function (Blueprint $table) {
            $table->id();
            // Link to the Patient (User)
            $table->foreignId('patient_id')->constrained('users')->onDelete('cascade');
            // Link to the Doctor (User)
            $table->foreignId('doctor_id')->constrained('users')->onDelete('cascade');
            
            $table->dateTime('appointment_date');
            $table->string('status')->default('scheduled'); // scheduled, completed, cancelled
            $table->text('notes')->nullable();
            
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('appointments');
    }
};