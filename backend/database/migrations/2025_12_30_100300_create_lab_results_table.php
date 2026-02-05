<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lab_results', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lab_order_id')->constrained('lab_orders')->cascadeOnDelete();
            $table->foreignId('patient_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('doctor_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('test_name');
            $table->text('result_value')->nullable();
            $table->string('unit')->nullable();
            $table->string('reference_range')->nullable();
            $table->enum('status', ['normal', 'abnormal', 'critical'])->default('normal');
            $table->text('interpretation')->nullable();
            $table->string('file_url')->nullable();
            $table->date('result_date');
            $table->boolean('doctor_reviewed')->default(false);
            $table->timestamp('reviewed_at')->nullable();
            $table->text('doctor_notes')->nullable();
            $table->timestamps();

            $table->index('lab_order_id');
            $table->index('patient_id');
            $table->index('doctor_id');
            $table->index('result_date');
            $table->index('doctor_reviewed');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lab_results');
    }
};

