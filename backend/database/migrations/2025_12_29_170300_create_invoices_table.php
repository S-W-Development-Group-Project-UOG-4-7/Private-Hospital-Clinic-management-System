<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('invoices', function (Blueprint $table) {
            $table->id();
            $table->string('invoice_number')->unique();
            $table->foreignId('patient_id')->constrained('users')->cascadeOnDelete();
            $table->decimal('amount', 10, 2);
            $table->enum('status', ['unpaid', 'partial', 'paid', 'cancelled'])->default('unpaid');
            $table->date('issued_at');
            $table->date('due_date')->nullable();
            $table->text('description')->nullable();
            $table->timestamps();

            $table->index('patient_id');
            $table->index('status');
            $table->index('issued_at');
            $table->index('due_date');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('invoices');
    }
};
