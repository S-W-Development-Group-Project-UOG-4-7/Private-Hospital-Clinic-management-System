<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('beds', function (Blueprint $table) {
            $table->id();
            // Link to the Ward
            $table->foreignId('ward_id')->constrained('wards')->onDelete('cascade');
            
            $table->string('bed_number');
            
            // We use 'is_available' (True = Empty, False = Occupied)
            $table->boolean('is_available')->default(true);
            
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('beds');
    }
};