<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class () extends Migration {
    /**
     * Add unique constraint to prevent duplicate feedback entries.
     */
    public function up(): void
    {
        // Postgres-safe: no-op if it already exists
        DB::statement(
            'CREATE UNIQUE INDEX IF NOT EXISTS live_insight_feedback_outbox_user_uidx
         ON live_insight_feedback (outbox_id, user_id)'
        );
    }

    public function down(): void
    {
        DB::statement('DROP INDEX IF EXISTS live_insight_feedback_outbox_user_uidx');
    }
};
