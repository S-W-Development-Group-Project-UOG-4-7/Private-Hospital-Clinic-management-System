<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('audit_logs', function (Blueprint $table) {
            $table->string('request_id', 64)->nullable()->after('id');
            $table->foreignId('actor_user_id')->nullable()->after('request_id')->constrained('users')->nullOnDelete();
            $table->json('before_data')->nullable()->after('entity_id');
            $table->json('after_data')->nullable()->after('before_data');

            $table->index('request_id');
            $table->index('actor_user_id');
        });
    }

    public function down(): void
    {
        Schema::table('audit_logs', function (Blueprint $table) {
            $table->dropIndex(['request_id']);
            $table->dropIndex(['actor_user_id']);
            $table->dropConstrainedForeignId('actor_user_id');
            $table->dropColumn(['request_id', 'before_data', 'after_data']);
        });
    }
};
