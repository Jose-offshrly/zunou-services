<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class () extends Migration {
    public function up(): void
    {
        // 1) Drop existing FK on meeting_id so we can alter the column
        Schema::table('live_insight_outbox', function (Blueprint $table) {
            // Uses the conventional name: live_insight_outbox_meeting_id_foreign
            $table->dropForeign(['meeting_id']);
        });

        // 2) Make meeting_id nullable and add message_id + team_message_id (both nullable)
        Schema::table('live_insight_outbox', function (Blueprint $table) {
            // requires doctrine/dbal to modify existing columns
            $table->uuid('meeting_id')->nullable()->change();

            // new message_id for 1:1 / regular messages
            $table->uuid('message_id')
                ->nullable()
                ->after('meeting_id');

            // new team_message_id for team / channel messages
            $table->uuid('team_message_id')
                ->nullable()
                ->after('message_id');
        });

        // 3) Clean up any bad meeting_id values before re-adding the FK
        DB::statement("
            UPDATE live_insight_outbox o
            SET meeting_id = NULL
            WHERE meeting_id IS NOT NULL
              AND NOT EXISTS (
                  SELECT 1 FROM meetings m WHERE m.id = o.meeting_id
              )
        ");

        // 4) Re-add FKs
        Schema::table('live_insight_outbox', function (Blueprint $table) {
            // meeting_id still points at meetings, now nullable
            $table->foreign('meeting_id')
                ->references('id')
                ->on('meetings')
                ->onDelete('cascade');

            // message_id → messages
            $table->foreign('message_id')
                ->references('id')
                ->on('messages')
                ->onDelete('cascade');

            // team_message_id → team_messages
            $table->foreign('team_message_id')
                ->references('id')
                ->on('team_messages')
                ->onDelete('cascade');
        });
    }

    public function down(): void
    {
        // Reverse the changes as best as possible

        Schema::table('live_insight_outbox', function (Blueprint $table) {
            // Drop new FKs first
            $table->dropForeign(['team_message_id']);
            $table->dropForeign(['message_id']);
            $table->dropForeign(['meeting_id']);
        });

        Schema::table('live_insight_outbox', function (Blueprint $table) {
            // Drop the new columns
            $table->dropColumn('team_message_id');
            $table->dropColumn('message_id');

            // Restore meeting_id to NOT NULL (will fail if NULLs exist)
            $table->uuid('meeting_id')->nullable(false)->change();
        });

        Schema::table('live_insight_outbox', function (Blueprint $table) {
            $table->foreign('meeting_id')
                ->references('id')
                ->on('meetings')
                ->onDelete('cascade');
        });
    }
};
