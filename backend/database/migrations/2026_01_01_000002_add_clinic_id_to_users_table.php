<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('users', function (Blueprint $table) {
            if (! Schema::hasColumn('users', 'clinic_id')) {
                $table->unsignedBigInteger('clinic_id')->nullable()->after('id');
                $table->foreign('clinic_id')->references('id')->on('clinics')->nullOnDelete();
            }
        });
    }

    public function down()
    {
        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'clinic_id')) {
                $table->dropForeign(['clinic_id']);
                $table->dropColumn('clinic_id');
            }
        });
    }
};