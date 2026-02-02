<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Create Departments Table
        if (!Schema::hasTable('departments')) {
            Schema::create('departments', function (Blueprint $table) {
                $table->id();
                $table->string('name')->unique(); // Unique name to prevent duplicates
                $table->text('description')->nullable();
                $table->string('status')->default('Active'); // Active or Inactive
                $table->timestamps();
            });
        }

        // 2. Add 'department_id' to 'users' table (to link Doctors to Departments)
        if (Schema::hasTable('users') && !Schema::hasColumn('users', 'department_id')) {
            Schema::table('users', function (Blueprint $table) {
                $table->unsignedBigInteger('department_id')->nullable()->after('id');
                
                // ENABLED: Foreign key constraint for data integrity
                $table->foreign('department_id')
                      ->references('id')
                      ->on('departments')
                      ->nullOnDelete(); 
            });
        }
    }

    public function down(): void
    {
        // Reverse operations
        if (Schema::hasTable('users')) {
            Schema::table('users', function (Blueprint $table) {
                if (Schema::hasColumn('users', 'department_id')) {
                    // Drop foreign key first (array syntax uses standard naming convention)
                    $table->dropForeign(['department_id']); 
                    $table->dropColumn('department_id');
                }
            });
        }
        
        Schema::dropIfExists('departments');
    }
};