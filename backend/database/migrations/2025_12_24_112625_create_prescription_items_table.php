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
        Schema::create('prescription_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('prescription_id')->constrained('prescriptions')->cascadeOnDelete();
            $table->foreignId('inventory_item_id')->constrained('inventory_items')->cascadeOnDelete();
            $table->integer('quantity');
            $table->string('dosage')->nullable(); // e.g., "500mg", "1 tablet"
            $table->string('frequency')->nullable(); // e.g., "twice daily", "once a day"
            $table->integer('duration_days')->nullable();
            $table->text('instructions')->nullable();
            $table->decimal('unit_price', 10, 2)->default(0);
            $table->decimal('total_price', 10, 2)->default(0);
            $table->boolean('is_dispensed')->default(false);
            $table->timestamps();
            
            $table->index('prescription_id');
            $table->index('inventory_item_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('prescription_items');
    }
};
