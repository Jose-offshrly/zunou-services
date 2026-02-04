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
        Schema::table('notification_user', function (Blueprint $table) {
            $table->index('is_archived', 'notification_user_is_archived_index');
            $table->index(
                ['user_id', 'is_archived'],
                'notification_user_user_archived_index'
            );
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('notification_user', function (Blueprint $table) {
            $table->dropIndex('notification_user_user_archived_index');
            $table->dropIndex('notification_user_is_archived_index');
        });
    }
};
