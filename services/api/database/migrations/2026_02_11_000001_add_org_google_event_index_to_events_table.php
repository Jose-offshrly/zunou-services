<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Index for org-level event uniqueness used by the new sync implementation.
     * Events are now unique per (organization_id, google_event_id).
     *
     * Also adds index on event_instances(event_id, pulse_id) to support
     * the GROUP BY in Phase 2 deduplication and avoid full sequential scans.
     */
    public function up(): void
    {
        DB::statement('
            CREATE INDEX IF NOT EXISTS events_org_google_event_idx
            ON events (organization_id, google_event_id)
        ');

        DB::statement('
            CREATE INDEX IF NOT EXISTS event_instances_event_pulse_idx
            ON event_instances (event_id, pulse_id)
        ');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement('DROP INDEX IF EXISTS event_instances_event_pulse_idx');
        DB::statement('DROP INDEX IF EXISTS events_org_google_event_idx');
    }
};
