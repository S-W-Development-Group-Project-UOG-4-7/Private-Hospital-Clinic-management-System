<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ehr_records', function (Blueprint $table) {
            $table->id();

            // Relationships
            $table->foreignId('patient_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('doctor_id')->nullable()->constrained('users')->nullOnDelete();

            // --- NEW FIELDS (Required for the Reports Feature) ---
            $table->text('diagnosis')->nullable();
            $table->text('prescription')->nullable();
            $table->text('notes')->nullable();
            // -----------------------------------------------------

            // Modified: Changed 'enum' to 'string' to allow more flexibility (e.g., "Consultation", "Surgery")
            $table->string('type')->nullable();

            $table->string('title')->nullable();
            $table->text('details')->nullable();
            $table->date('record_date')->nullable();
            $table->string('file_url')->nullable();
            $table->timestamps();

            // Indexes for performance
            $table->index('patient_id');
            $table->index('doctor_id');
            $table->index('type');
            $table->index('record_date');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ehr_records');
    }
};
