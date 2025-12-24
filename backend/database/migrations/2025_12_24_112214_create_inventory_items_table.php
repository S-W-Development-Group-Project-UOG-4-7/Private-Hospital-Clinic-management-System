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
        Schema::create('inventory_items', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('generic_name')->nullable();
            $table->string('brand_name')->nullable();
            $table->text('description')->nullable();
            $table->string('category')->nullable(); // e.g., Antibiotic, Pain Relief, etc.
            $table->string('unit')->default('unit'); // unit, box, bottle, etc.
            $table->integer('quantity')->default(0);
            $table->integer('reorder_level')->default(10); // Minimum stock level before reordering
            $table->decimal('unit_price', 10, 2)->default(0);
            $table->decimal('selling_price', 10, 2)->default(0);
            $table->date('expiry_date')->nullable();
            $table->string('batch_number')->nullable();
            $table->foreignId('supplier_id')->nullable()->constrained('suppliers')->nullOnDelete();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            
            $table->index('name');
            $table->index('category');
            $table->index('expiry_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('inventory_items');
    }
};
