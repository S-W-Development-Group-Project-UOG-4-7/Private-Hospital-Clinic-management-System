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
            $table->foreignId('patient_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('doctor_id')->nullable()->constrained('users')->nullOnDelete();
            $table->enum('type', ['diagnosis', 'lab_report']);
            $table->string('title');
            $table->text('details')->nullable();
            $table->date('record_date')->nullable();
            $table->string('file_url')->nullable();
            $table->timestamps();

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
