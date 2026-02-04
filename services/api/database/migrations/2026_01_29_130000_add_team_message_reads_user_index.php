<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Fix sequential scan issue on team_message_reads table.
     * 
     * team_message_reads: 424K seq scans reading 16B rows - user_id filter queries
     * 
     * Existing index is (team_message_id, user_id) which doesn't help
     * "get reads for user" query patterns.
     */
    public function up(): void
    {
        DB::statement('CREATE INDEX IF NOT EXISTS team_message_reads_user_message_idx ON team_message_reads (user_id, team_message_id)');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement('DROP INDEX IF EXISTS team_message_reads_user_message_idx');
    }
};
