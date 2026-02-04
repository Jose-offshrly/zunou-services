<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (!Schema::hasTable('live_insight_outbox')) {
            return;
        }

        // First, ensure read_at has the most recent value from either field
        // This handles the case where seen_at might be more recent than read_at
        DB::statement("
            UPDATE live_insight_outbox
            SET read_at = GREATEST(
                COALESCE(read_at, '1970-01-01'::timestamp),
                COALESCE(seen_at, '1970-01-01'::timestamp)
            )
            WHERE seen_at IS NOT NULL OR read_at IS NOT NULL
        ");

        // Drop the seen_at column since we're consolidating to read_at
        Schema::table('live_insight_outbox', function (Blueprint $table) {
            if (Schema::hasColumn('live_insight_outbox', 'seen_at')) {
                $table->dropColumn('seen_at');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (!Schema::hasTable('live_insight_outbox')) {
            return;
        }

        // Re-add the seen_at column
        Schema::table('live_insight_outbox', function (Blueprint $table) {
            if (!Schema::hasColumn('live_insight_outbox', 'seen_at')) {
                $table->timestampTz('seen_at')->nullable()->after('delivered_at');
            }
        });

        // Copy read_at to seen_at for rollback
        DB::statement("
            UPDATE live_insight_outbox
            SET seen_at = read_at
            WHERE read_at IS NOT NULL
        ");
    }
};