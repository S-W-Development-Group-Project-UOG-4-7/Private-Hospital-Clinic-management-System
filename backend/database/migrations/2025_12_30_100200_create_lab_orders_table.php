<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lab_orders', function (Blueprint $table) {
            $table->id();
            $table->string('order_number')->unique();
            $table->foreignId('patient_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('doctor_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('appointment_id')->nullable()->constrained('appointments')->nullOnDelete();
            $table->string('test_type');
            $table->text('test_description')->nullable();
            $table->enum('status', ['pending', 'in_progress', 'completed', 'cancelled'])->default('pending');
            $table->date('order_date');
            $table->date('due_date')->nullable();
            $table->text('notes')->nullable();
            $table->text('instructions')->nullable();
            $table->timestamps();

            $table->index('order_number');
            $table->index('patient_id');
            $table->index('doctor_id');
            $table->index('appointment_id');
            $table->index('status');
            $table->index('order_date');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lab_orders');
    }
};

