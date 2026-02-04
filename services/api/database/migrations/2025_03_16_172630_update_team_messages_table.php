<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class () extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('team_messages', function (Blueprint $table) {
            // Drop the old foreign key for thread_id.
            $table->dropForeign(['thread_id']);

            // Rename thread_id to reply_team_thread_id.
            $table->renameColumn('thread_id', 'reply_team_thread_id');

            // Add the new foreign key referencing reply_team_threads.
            $table
                ->foreign('reply_team_thread_id')
                ->references('id')
                ->on('reply_team_threads')
                ->onDelete('cascade');

            // Add the new boolean column is_parent_reply with default false.
            $table->boolean('is_parent_reply')->default(false);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('team_messages', function (Blueprint $table) {
            // Drop the new foreign key.
            $table->dropForeign(['reply_team_thread_id']);

            // Remove the is_parent_reply column.
            $table->dropColumn('is_parent_reply');

            // Rename reply_team_thread_id back to thread_id.
            $table->renameColumn('reply_team_thread_id', 'thread_id');

            // Re-add the original foreign key referencing threads.
            $table
                ->foreign('thread_id')
                ->references('id')
                ->on('threads')
                ->onDelete('cascade');
        });
    }
};
