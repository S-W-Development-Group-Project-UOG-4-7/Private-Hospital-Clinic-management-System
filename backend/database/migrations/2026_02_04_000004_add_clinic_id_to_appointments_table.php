<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('appointments', 'clinic_id')) {
            Schema::table('appointments', function (Blueprint $table) {
                $table->unsignedBigInteger('clinic_id')->nullable()->after('department_id');
                $table->foreign('clinic_id')->references('id')->on('clinics')->nullOnDelete();
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('appointments', 'clinic_id')) {
            Schema::table('appointments', function (Blueprint $table) {
                $table->dropForeign(['clinic_id']);
                $table->dropColumn('clinic_id');
            });
        }
    }
};
