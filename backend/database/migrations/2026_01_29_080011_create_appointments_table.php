<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        if (!Schema::hasTable('appointments')) {
            Schema::create('appointments', function (Blueprint $table) {
                $table->id();
                // Link to Patient (User)
                $table->foreignId('patient_id')->constrained('users')->onDelete('cascade');
                
                // Link to Doctor (User)
                $table->foreignId('doctor_id')->constrained('users')->onDelete('cascade');
                
                // Link to Department (Optional, set to null if department is deleted)
                $table->foreignId('department_id')->nullable()->constrained('departments')->onDelete('set null');
                
                $table->dateTime('appointment_date');
                $table->string('status')->default('Scheduled'); // Scheduled, Completed, Cancelled
                $table->string('reason')->nullable();
                $table->text('notes')->nullable();
                $table->timestamps();
            });
        }
    }

    public function down()
    {
        Schema::dropIfExists('appointments');
    }
};