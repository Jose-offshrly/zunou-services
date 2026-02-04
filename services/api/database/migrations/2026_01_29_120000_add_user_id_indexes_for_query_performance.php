<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Fix sequential scan issue on pulse_members and events tables.
     * 
     * pulse_members: 126M seq scans reading 68B rows - scopeForCurrentUser whereHas pattern
     * events: 11.8M seq scans reading 258B rows - user_id filter queries
     * 
     * Both tables have indexes that don't support "find by user" query patterns.
     */
    public function up(): void
    {
        // Fix: existing (pulse_id, user_id) doesn't help whereHas filtering by user_id
        DB::statement('CREATE INDEX IF NOT EXISTS pulse_members_user_pulse_idx ON pulse_members (user_id, pulse_id)');
        
        // Fix: no user_id index exists
        DB::statement('CREATE INDEX IF NOT EXISTS events_user_start_at_idx ON events (user_id, start_at)');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement('DROP INDEX IF EXISTS pulse_members_user_pulse_idx');
        DB::statement('DROP INDEX IF EXISTS events_user_start_at_idx');
    }
};
