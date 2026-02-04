<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('personalization_contexts', function (Blueprint $table) {
            $table->index(
                ['user_id', 'expires_at'],
                'personalization_contexts_user_expires_at_index'
            );

            $table->index(
                'expires_at',
                'personalization_contexts_expires_at_index'
            );
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('personalization_contexts', function (Blueprint $table) {
            $table->dropIndex('personalization_contexts_expires_at_index');
            $table->dropIndex('personalization_contexts_user_expires_at_index');
        });
    }
};
