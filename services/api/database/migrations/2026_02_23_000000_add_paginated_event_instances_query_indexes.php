<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Composite indexes to support PaginatedEventInstancesQuery.
     *
     * The query joins event_instances → events, filters by pulse_id on
     * event_instances and by organization_id on events, orders by
     * events.start_at, and optionally filters by a date range (start_at /
     * end_at) and/or does a self-join on event_instances for teamPulseId.
     *
     * All three are partial indexes (WHERE deleted_at IS NULL) so they only
     * cover live rows and stay small.
     */
    public function up(): void
    {
        // 1. Main event_instances scan: WHERE pulse_id = ? AND deleted_at IS NULL
        //    The existing (pulse_id, event_id) index doesn't filter soft-deleted
        //    rows at the index level, forcing a post-filter on every scanned row.
        DB::statement('
            CREATE INDEX IF NOT EXISTS event_instances_pulse_event_active_idx
            ON event_instances (pulse_id, event_id)
            WHERE deleted_at IS NULL
        ');

        // 2. events JOIN + ORDER BY: WHERE organization_id = ? AND deleted_at IS NULL
        //    ORDER BY start_at, with optional date-range filter on start_at / end_at.
        //    The existing (organization_id, pulse_id, start_at) index cannot be used
        //    efficiently here because pulse_id is not filtered on the events table,
        //    making start_at unreachable without a full pulse_id scan step.
        DB::statement('
            CREATE INDEX IF NOT EXISTS events_org_start_end_active_idx
            ON events (organization_id, start_at, end_at)
            WHERE deleted_at IS NULL
        ');

        // 3. teamPulseId self-join on event_instances alias "t":
        //    ON t.event_id = event_instances.event_id AND t.pulse_id = ? AND t.deleted_at IS NULL
        //    The existing (event_id, pulse_id) index doesn't cover deleted_at.
        DB::statement('
            CREATE INDEX IF NOT EXISTS event_instances_event_pulse_active_idx
            ON event_instances (event_id, pulse_id)
            WHERE deleted_at IS NULL
        ');
    }

    public function down(): void
    {
        DB::statement('DROP INDEX IF EXISTS event_instances_pulse_event_active_idx');
        DB::statement('DROP INDEX IF EXISTS events_org_start_end_active_idx');
        DB::statement('DROP INDEX IF EXISTS event_instances_event_pulse_active_idx');
    }
};
