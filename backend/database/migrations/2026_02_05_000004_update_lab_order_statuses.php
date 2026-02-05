<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasColumn('lab_orders', 'status')) {
            $driver = DB::connection()->getDriverName();

            if ($driver === 'pgsql') {
                // Drop existing check constraint so new status values can be set
                DB::statement("ALTER TABLE lab_orders DROP CONSTRAINT IF EXISTS lab_orders_status_check");
                DB::statement("ALTER TABLE lab_orders ALTER COLUMN status TYPE VARCHAR(50)");
            } else {
                Schema::table('lab_orders', function (Blueprint $table) {
                    $table->string('status', 50)->change();
                });
            }

            DB::table('lab_orders')
                ->where('status', 'pending')
                ->update(['status' => 'ORDERED']);
            DB::table('lab_orders')
                ->where('status', 'in_progress')
                ->update(['status' => 'COLLECTED']);
            DB::table('lab_orders')
                ->where('status', 'completed')
                ->update(['status' => 'REPORTED']);
            DB::table('lab_orders')
                ->where('status', 'cancelled')
                ->update(['status' => 'CANCELLED']);

            if ($driver === 'pgsql') {
                // Recreate constraint with new allowed values
                DB::statement("ALTER TABLE lab_orders ADD CONSTRAINT lab_orders_status_check CHECK (status IN ('ORDERED', 'COLLECTED', 'REPORTED', 'REVIEWED', 'CANCELLED'))");
            }
        }
    }

    public function down(): void
    {
        // No-op: keep string status to avoid data loss.
    }
};
