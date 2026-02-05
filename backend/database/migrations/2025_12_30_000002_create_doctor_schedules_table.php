<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('doctor_schedules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('doctor_id')->constrained('users')->cascadeOnDelete();
            $table->date('schedule_date');
            $table->time('start_time');
            $table->time('end_time');
            $table->boolean('is_available')->default(true);
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index('doctor_id');
            $table->index('schedule_date');
            $table->index('is_available');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('doctor_schedules');
    }
};
