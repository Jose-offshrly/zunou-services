<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Add missing indexes for eager-load queries fired by PaginatedEventInstancesQuery.
     *
     * Two queries were doing full/large table scans:
     *
     * 1. event.meetingSession eager load:
     *    SELECT * FROM meeting_sessions WHERE event_id IN (...) ORDER BY created_at DESC
     *    — no index on event_id existed, causing a full scan on every request.
     *
     * 2. event.agendas eager load:
     *    SELECT * FROM agendas WHERE event_id IN (...)
     *    — the only relevant index leads with organization_id, making event_id
     *      unreachable without scanning the full index.
     */
    public function up(): void
    {
        // 1. meeting_sessions.event_id — supports HasOne/HasMany eager loads
        //    that resolve meeting sessions by their parent event.
        DB::statement('
            CREATE INDEX IF NOT EXISTS meeting_sessions_event_id_idx
            ON meeting_sessions (event_id)
        ');

        // 2. agendas.event_id — standalone index so the eager load
        //    SELECT * FROM agendas WHERE event_id IN (...) can use an index seek
        //    rather than falling back to the composite (organization_id, pulse_id, event_id, position).
        DB::statement('
            CREATE INDEX IF NOT EXISTS agendas_event_id_idx
            ON agendas (event_id)
        ');
    }

    public function down(): void
    {
        DB::statement('DROP INDEX IF EXISTS meeting_sessions_event_id_idx');
        DB::statement('DROP INDEX IF EXISTS agendas_event_id_idx');
    }
};
