<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('queue_entries', function (Blueprint $table) {
            // Add consultation_started_at column if it doesn't exist
            if (!Schema::hasColumn('queue_entries', 'consultation_started_at')) {
                $table->timestamp('consultation_started_at')->nullable()->after('checked_in_at');
            }
        });

        if (Schema::getConnection()->getDriverName() === 'pgsql') {
            // For PostgreSQL, we need to modify the enum by altering the column type
            // First, drop the enum constraint and recreate with new values
            DB::statement("ALTER TABLE queue_entries DROP CONSTRAINT IF EXISTS queue_entries_status_check");
            DB::statement("ALTER TABLE queue_entries ALTER COLUMN status TYPE VARCHAR(50)");
            DB::statement("ALTER TABLE queue_entries ADD CONSTRAINT queue_entries_status_check CHECK (status IN ('waiting', 'in_consultation', 'in_progress', 'completed', 'cancelled', 'no_show'))");
        }
    }

    public function down(): void
    {
        Schema::table('queue_entries', function (Blueprint $table) {
            if (Schema::hasColumn('queue_entries', 'consultation_started_at')) {
                $table->dropColumn('consultation_started_at');
            }
        });

        if (Schema::getConnection()->getDriverName() === 'pgsql') {
            // Revert enum back to original values
            DB::statement("ALTER TABLE queue_entries DROP CONSTRAINT IF EXISTS queue_entries_status_check");
            DB::statement("ALTER TABLE queue_entries ADD CONSTRAINT queue_entries_status_check CHECK (status IN ('waiting', 'in_consultation', 'completed', 'cancelled'))");
        }
    }
};
