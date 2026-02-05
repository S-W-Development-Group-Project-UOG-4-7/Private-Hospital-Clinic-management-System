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
        Schema::table('queue_entries', function (Blueprint $table) {
            if (!Schema::hasColumn('queue_entries', 'called_at')) {
                $table->timestamp('called_at')->nullable()->after('checked_in_at');
            }
            if (!Schema::hasColumn('queue_entries', 'completed_at')) {
                $table->timestamp('completed_at')->nullable()->after('checked_out_at');
            }
            if (!Schema::hasColumn('queue_entries', 'priority')) {
                $table->string('priority')->default('normal')->after('status');
            }
            if (!Schema::hasColumn('queue_entries', 'notes')) {
                $table->text('notes')->nullable()->after('priority');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('queue_entries', function (Blueprint $table) {
            $table->dropColumn(['called_at', 'completed_at', 'priority', 'notes']);
        });
    }
};
