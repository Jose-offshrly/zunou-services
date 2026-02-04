<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Indexes for Google Calendar sync jobs.
     *
     * @return void
     */
    public function up(): void
    {
        // For updateOrCreate and delete lookups during sync
        DB::statement('
            CREATE INDEX IF NOT EXISTS events_user_pulse_google_event_idx
            ON events (user_id, pulse_id, google_event_id)
        ');

        // For recurring event prefix matching (google_event_id LIKE 'base_%')
        DB::statement('
            CREATE INDEX IF NOT EXISTS events_user_google_event_idx
            ON events (user_id, google_event_id)
        ');
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down(): void
    {
        DB::statement('DROP INDEX IF EXISTS events_user_pulse_google_event_idx');
        DB::statement('DROP INDEX IF EXISTS events_user_google_event_idx');
    }
};
