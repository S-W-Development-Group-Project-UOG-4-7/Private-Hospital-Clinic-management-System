<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (DB::connection()->getDriverName() === 'pgsql') {
            $this->createIndexIfMissing('appointments', 'appointments_appointment_date_index', 'appointment_date');
            $this->createIndexIfMissing('appointments', 'appointments_status_index', 'status');
            $this->createIndexIfMissing('appointments', 'appointments_doctor_id_appointment_date_index', 'doctor_id, appointment_date');

            $this->createIndexIfMissing('stock_ledgers', 'stock_ledgers_type_created_at_index', 'type, created_at');

            $this->createIndexIfMissing('invoices', 'invoices_status_index', 'status');
            $this->createIndexIfMissing('invoices', 'invoices_issued_at_index', 'issued_at');

            $this->createIndexIfMissing('payments', 'payments_paid_at_index', 'paid_at');
        } else {
            Schema::table('appointments', function (Blueprint $table) {
                $table->index('appointment_date');
                $table->index('status');
                $table->index(['doctor_id', 'appointment_date']);
            });

            Schema::table('stock_ledgers', function (Blueprint $table) {
                $table->index(['type', 'created_at']);
            });

            Schema::table('invoices', function (Blueprint $table) {
                $table->index('status');
                $table->index('issued_at');
            });

            Schema::table('payments', function (Blueprint $table) {
                $table->index('paid_at');
            });
        }
    }

    public function down(): void
    {
        if (DB::connection()->getDriverName() === 'pgsql') {
            DB::statement('DROP INDEX IF EXISTS appointments_appointment_date_index');
            DB::statement('DROP INDEX IF EXISTS appointments_status_index');
            DB::statement('DROP INDEX IF EXISTS appointments_doctor_id_appointment_date_index');
            DB::statement('DROP INDEX IF EXISTS stock_ledgers_type_created_at_index');
            DB::statement('DROP INDEX IF EXISTS invoices_status_index');
            DB::statement('DROP INDEX IF EXISTS invoices_issued_at_index');
            DB::statement('DROP INDEX IF EXISTS payments_paid_at_index');
        } else {
            Schema::table('appointments', function (Blueprint $table) {
                $table->dropIndex(['appointment_date']);
                $table->dropIndex(['status']);
                $table->dropIndex(['doctor_id', 'appointment_date']);
            });

            Schema::table('stock_ledgers', function (Blueprint $table) {
                $table->dropIndex(['type', 'created_at']);
            });

            Schema::table('invoices', function (Blueprint $table) {
                $table->dropIndex(['status']);
                $table->dropIndex(['issued_at']);
            });

            Schema::table('payments', function (Blueprint $table) {
                $table->dropIndex(['paid_at']);
            });
        }
    }

    private function createIndexIfMissing(string $table, string $indexName, string $columns): void
    {
        $exists = DB::selectOne(
            'select 1 from pg_indexes where schemaname = current_schema() and indexname = ?',
            [$indexName]
        );

        if (! $exists) {
            DB::statement(sprintf('CREATE INDEX %s ON %s (%s)', $indexName, $table, $columns));
        }
    }
};
