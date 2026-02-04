<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Add composite indexes to live_insight_outbox for MyLiveInsightsQuery.
     *
     * All queries filter by user_id and sort by created_at DESC.
     * We skip delivery_status in the index since it uses IN() which
     * breaks index ordering - Postgres filters it post-scan instead.
     *
     * @return void
     */
    public function up(): void
    {
        // Main inbox query - covers most list views
        DB::statement('
            CREATE INDEX IF NOT EXISTS live_insight_outbox_user_created_idx
            ON live_insight_outbox (user_id, created_at DESC)
        ');

        // Pulse filter - equality match so ordering still works
        DB::statement('
            CREATE INDEX IF NOT EXISTS live_insight_outbox_user_pulse_created_idx
            ON live_insight_outbox (user_id, pulse_id, created_at DESC)
        ');

        // Partial index for bookmarked items only - keeps it small
        DB::statement('
            CREATE INDEX IF NOT EXISTS live_insight_outbox_user_bookmarked_created_idx
            ON live_insight_outbox (user_id, created_at DESC)
            WHERE is_bookmarked = true
        ');
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down(): void
    {
        DB::statement('DROP INDEX IF EXISTS live_insight_outbox_user_created_idx');
        DB::statement('DROP INDEX IF EXISTS live_insight_outbox_user_pulse_created_idx');
        DB::statement('DROP INDEX IF EXISTS live_insight_outbox_user_bookmarked_created_idx');
    }
};
