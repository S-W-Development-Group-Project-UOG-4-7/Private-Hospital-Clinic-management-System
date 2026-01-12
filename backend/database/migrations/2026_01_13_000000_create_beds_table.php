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
        Schema::create('beds', function (Blueprint $table) {
            $table->id();
            
            // 1. Link this bed to a specific Ward (e.g., ICU, General Ward)
            // This assumes you have already created a 'wards' table.
            $table->foreignId('ward_id')->constrained()->onDelete('cascade');

            // 2. The visible label for the bed (e.g., "A-101", "ICU-05")
            $table->string('bed_number');

            // 3. Track status. Default is false (Empty) when created.
            $table->boolean('is_occupied')->default(false);

            // 4. Optional: Add notes (e.g., "Broken wheel", "Reserved")
            $table->text('notes')->nullable();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('beds');
    }
};