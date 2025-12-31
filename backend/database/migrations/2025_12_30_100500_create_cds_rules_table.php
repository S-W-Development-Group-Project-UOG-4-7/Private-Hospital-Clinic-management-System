<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cds_rules', function (Blueprint $table) {
            $table->id();
            $table->string('rule_type'); // 'drug_interaction', 'allergy', 'duplicate_medication'
            $table->string('rule_name');
            $table->text('description')->nullable();
            $table->json('conditions')->nullable(); // Store rule conditions as JSON
            $table->enum('severity', ['low', 'medium', 'high', 'critical'])->default('medium');
            $table->text('warning_message');
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index('rule_type');
            $table->index('severity');
            $table->index('is_active');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cds_rules');
    }
};

