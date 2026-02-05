<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('video_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('appointment_id')->constrained('appointments')->cascadeOnDelete();
            $table->string('provider')->default('JITSI');
            $table->string('room_id')->unique();
            $table->string('join_url_patient');
            $table->string('join_url_doctor');
            $table->string('status')->default('CREATED');
            $table->timestamps();

            $table->unique('appointment_id');
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('video_sessions');
    }
};
