<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class () extends Migration {
    /**
     * Run the migrations.
     *
     * Add 'on_device' to the data_sources origin check constraint.
     * PostgreSQL enum columns require dropping and recreating the constraint.
     */
    public function up(): void
    {
        // Drop the existing check constraint
        DB::statement('ALTER TABLE data_sources DROP CONSTRAINT IF EXISTS data_sources_origin_check');

        // Add the new check constraint with 'on_device' included
        DB::statement("ALTER TABLE data_sources ADD CONSTRAINT data_sources_origin_check CHECK (origin IN ('custom', 'preset', 'meeting', 'note', 'on_device'))");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Drop the new constraint
        DB::statement('ALTER TABLE data_sources DROP CONSTRAINT IF EXISTS data_sources_origin_check');

        // Restore the original constraint without 'on_device'
        DB::statement("ALTER TABLE data_sources ADD CONSTRAINT data_sources_origin_check CHECK (origin IN ('custom', 'preset', 'meeting', 'note'))");
    }
};
