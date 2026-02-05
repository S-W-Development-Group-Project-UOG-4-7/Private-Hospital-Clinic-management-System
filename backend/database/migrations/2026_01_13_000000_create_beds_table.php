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

            // FIX: Explicitly specify 'wards' as the table name
            // This prevents PostgreSQL from getting confused about which table to link to.
            $table->foreignId('ward_id')->constrained('wards')->onDelete('cascade');

            // The visible label for the bed (e.g., "A-101", "ICU-05")
            $table->string('bed_number');

            // Track status. Default is false (Empty) when created.
            $table->boolean('is_occupied')->default(false);

            // Optional: Add notes (e.g., "Broken wheel", "Reserved")
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