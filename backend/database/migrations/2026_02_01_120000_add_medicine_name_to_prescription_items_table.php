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
        Schema::table('prescription_items', function (Blueprint $table) {
            // Add medicine_name column for prescriptions without inventory items
            $table->string('medicine_name')->nullable()->after('inventory_item_id');
            
            // Make inventory_item_id nullable to allow custom medicines
            $table->foreignId('inventory_item_id')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('prescription_items', function (Blueprint $table) {
            $table->dropColumn('medicine_name');
        });
    }
};
