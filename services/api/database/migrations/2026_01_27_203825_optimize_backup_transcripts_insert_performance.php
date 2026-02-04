<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Fix slow INSERTs on backup_transcripts (57ms avg from Sentry).
     *
     * Switches TOAST storage from EXTENDED to EXTERNAL to skip compression
     * on the content column. Trades some disk space for faster writes.
     *
     * PostgreSQL only - skipped on other databases.
     */
    public function up(): void
    {
        if (DB::connection()->getDriverName() !== 'pgsql') {
            return;
        }

        // EXTERNAL = no compression, EXTENDED = compressed (default)
        DB::statement('ALTER TABLE backup_transcripts ALTER COLUMN content SET STORAGE EXTERNAL');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (DB::connection()->getDriverName() !== 'pgsql') {
            return;
        }

        DB::statement('ALTER TABLE backup_transcripts ALTER COLUMN content SET STORAGE EXTENDED');
    }
};
