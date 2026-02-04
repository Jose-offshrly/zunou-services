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
        Schema::table('team_messages', function (Blueprint $table) {
            $table->index(
                'reply_team_thread_id',
                'team_messages_reply_team_thread_id_index'
            );
            $table->index('is_system', 'team_messages_is_system_index');
            $table->index(
                ['team_thread_id', 'topic_id', 'is_system', 'created_at'],
                'team_messages_thread_topic_system_created_index'
            );
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('team_messages', function (Blueprint $table) {
            $table->dropIndex(
                'team_messages_thread_topic_system_created_index'
            );
            $table->dropIndex('team_messages_is_system_index');
            $table->dropIndex('team_messages_reply_team_thread_id_index');
        });
    }
};
