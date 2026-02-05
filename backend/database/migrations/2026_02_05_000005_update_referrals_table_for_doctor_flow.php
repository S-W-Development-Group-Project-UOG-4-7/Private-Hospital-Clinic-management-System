<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('referrals', function (Blueprint $table) {
            if (!Schema::hasColumn('referrals', 'referred_by_doctor_id')) {
                $table->foreignId('referred_by_doctor_id')->nullable()->after('patient_id')->constrained('users')->nullOnDelete();
            }
            if (!Schema::hasColumn('referrals', 'referred_to_doctor_id')) {
                $table->foreignId('referred_to_doctor_id')->nullable()->after('referred_by_doctor_id')->constrained('users')->nullOnDelete();
            }
            if (!Schema::hasColumn('referrals', 'to_department_id')) {
                $table->foreignId('to_department_id')->nullable()->after('referred_to_doctor_id')->constrained('departments')->nullOnDelete();
            }
            if (!Schema::hasColumn('referrals', 'clinic_id')) {
                $table->foreignId('clinic_id')->nullable()->after('to_department_id')->constrained('clinics')->nullOnDelete();
            }
            if (!Schema::hasColumn('referrals', 'reason')) {
                $table->text('reason')->nullable()->after('clinic_id');
            }
            if (!Schema::hasColumn('referrals', 'status')) {
                $table->string('status')->default('pending')->after('reason');
            }
            if (!Schema::hasColumn('referrals', 'referred_at')) {
                $table->date('referred_at')->nullable()->after('status');
            }
            if (!Schema::hasColumn('referrals', 'notes')) {
                $table->text('notes')->nullable()->after('referred_at');
            }
            if (!Schema::hasColumn('referrals', 'created_by')) {
                $table->foreignId('created_by')->nullable()->after('notes')->constrained('users')->nullOnDelete();
            }
        });
    }

    public function down(): void
    {
        // No-op to avoid destructive changes on legacy data.
    }
};
