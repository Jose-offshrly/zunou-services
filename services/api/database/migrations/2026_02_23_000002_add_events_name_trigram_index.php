<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Enable pg_trgm extension and add GIN trigram index on events.name
     * for efficient case-insensitive substring search (ILIKE '%pattern%').
     *
     * Without this index, LIKE/ILIKE with leading wildcards causes full table scans.
     * The trigram index enables efficient substring matching.
     */
    public function up(): void
    {
        // Enable the pg_trgm extension if not already enabled
        DB::statement('CREATE EXTENSION IF NOT EXISTS pg_trgm');

        // Create a GIN trigram index on events.name for efficient substring search
        // This index supports ILIKE '%pattern%' queries efficiently
        DB::statement('CREATE INDEX IF NOT EXISTS events_name_trgm_idx ON events USING GIN (name gin_trgm_ops)');
    }

    public function down(): void
    {
        DB::statement('DROP INDEX IF EXISTS events_name_trgm_idx');
        // Note: We don't drop the extension as other tables may use it
    }
};
