<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class () extends Migration {
    public function up(): void
    {
        /**
         * kb_facts: add lifecycle_state + transition timestamps (backwards-compatible)
         * Keep existing 'status' CHECK ('open','closed') untouched.
         */
        if (Schema::hasTable('kb_facts')) {
            if (!Schema::hasColumn('kb_facts', 'lifecycle_state')) {
                DB::statement("
                    ALTER TABLE kb_facts
                    ADD COLUMN lifecycle_state TEXT
                ");
                // Soft-check via a separate constraint that doesn't clash with 'status'
                DB::statement("
                    ALTER TABLE kb_facts
                    ADD CONSTRAINT kb_facts_lifecycle_check
                    CHECK (lifecycle_state IN ('open','in_progress','stale','closed'))
                ");
                // Default lifecycle_state for existing rows: map from status
                DB::statement("
                    UPDATE kb_facts
                    SET lifecycle_state = CASE
                        WHEN status = 'closed' THEN 'closed'
                        ELSE 'open'
                    END
                    WHERE lifecycle_state IS NULL
                ");
            }

            if (!Schema::hasColumn('kb_facts', 'first_opened_at')) {
                DB::statement("ALTER TABLE kb_facts ADD COLUMN first_opened_at timestamptz NULL");
                DB::statement("
                    UPDATE kb_facts
                    SET first_opened_at = COALESCE(first_seen_at, NOW())
                    WHERE first_opened_at IS NULL
                ");
            }

            if (!Schema::hasColumn('kb_facts', 'last_transition_at')) {
                DB::statement("ALTER TABLE kb_facts ADD COLUMN last_transition_at timestamptz NULL");
                DB::statement("
                    UPDATE kb_facts
                    SET last_transition_at = COALESCE(updated_at, NOW())
                    WHERE last_transition_at IS NULL
                ");
            }

            if (!Schema::hasColumn('kb_facts', 'auto_closed_at')) {
                DB::statement("ALTER TABLE kb_facts ADD COLUMN auto_closed_at timestamptz NULL");
            }
        }

        /**
         * kb_fact_events: immutable event log per fact
         */
        if (!Schema::hasTable('kb_fact_events')) {
            Schema::create('kb_fact_events', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->uuid('fact_id');                    // FK -> kb_facts(id)
                $table->text('event_type');                 // CHECK below
                $table->jsonb('payload')->nullable();       // {before:..., after:..., reason:..., source:...}
                $table->text('source')->nullable();         // 'stage_a'|'stage_c'|'github'|'jira'|...
                $table->text('actor_type')->nullable();     // 'system'|'user'|'service'
                $table->text('actor_id')->nullable();       // user_id or integration id
                $table->timestamptz('occurred_at');         // when it happened (business time)
                $table->timestampsTz();                     // created_at/updated_at

                $table->foreign('fact_id')->references('id')->on('kb_facts')->onDelete('cascade');
                $table->index(['fact_id','occurred_at'], 'kb_fact_events_fact_time_idx');
            });
            DB::statement("ALTER TABLE kb_fact_events
                ADD CONSTRAINT kb_fact_events_type_check
                CHECK (event_type IN (
                    'sighted','state_changed','owner_changed','due_changed','text_changed',
                    'auto_closed','reopened','merged'
                ))");
        }

        /**
         * kb_fact_versions: materialized snapshots for time-travel queries
         * (Keep it lean: store non-vector fields. Recompute embeddings when needed.)
         */
        if (!Schema::hasTable('kb_fact_versions')) {
            Schema::create('kb_fact_versions', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->uuid('fact_id');                      // FK -> kb_facts(id)
                $table->bigInteger('version_no');             // monotonic per fact
                $table->timestamptz('as_of');                 // version business time
                $table->jsonb('snapshot');                    // selective fields snapshot
                $table->timestampsTz();

                $table->foreign('fact_id')->references('id')->on('kb_facts')->onDelete('cascade');
                $table->unique(['fact_id','version_no'], 'kb_fact_versions_unique_per_fact');
                $table->index(['fact_id','as_of'], 'kb_fact_versions_asof_idx');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('kb_fact_versions');
        Schema::dropIfExists('kb_fact_events');

        if (Schema::hasTable('kb_facts')) {
            DB::statement("ALTER TABLE kb_facts DROP CONSTRAINT IF EXISTS kb_facts_lifecycle_check");
            DB::statement("ALTER TABLE kb_facts DROP COLUMN IF EXISTS lifecycle_state");
            DB::statement("ALTER TABLE kb_facts DROP COLUMN IF EXISTS first_opened_at");
            DB::statement("ALTER TABLE kb_facts DROP COLUMN IF EXISTS last_transition_at");
            DB::statement("ALTER TABLE kb_facts DROP COLUMN IF EXISTS auto_closed_at");
        }
    }
};
