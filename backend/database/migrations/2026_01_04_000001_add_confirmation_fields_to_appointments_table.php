<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('appointments', function (Blueprint $table) {
            $table->timestamp('confirmed_at')->nullable()->after('status');
            $table->boolean('is_walk_in')->default(false)->after('confirmed_at');

            $table->index('confirmed_at');
            $table->index('is_walk_in');
        });
    }

    public function down(): void
    {
        Schema::table('appointments', function (Blueprint $table) {
            $table->dropIndex(['confirmed_at']);
            $table->dropIndex(['is_walk_in']);

            $table->dropColumn(['confirmed_at', 'is_walk_in']);
        });
    }
};
