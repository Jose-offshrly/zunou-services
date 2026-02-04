<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class () extends Migration {
    public function up(): void
    {
        // Ensure pgvector extension
        DB::statement('CREATE EXTENSION IF NOT EXISTS vector');

        /**
         * kb_facts
         * If table already exists, skip everything for this table.
         */
        if (!Schema::hasTable('kb_facts')) {
            Schema::create('kb_facts', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->uuid('pulse_id');        // FK -> pulses(id)
                $table->uuid('meeting_id')->nullable(); // FK -> meetings(id)
                $table->text('type');            // CHECK: action|decision|risk
                $table->text('canonical_text');  // short stable representation
                $table->string('topic', 256)->nullable();

                $table->text('status')->default('open'); // CHECK: open|closed
                $table->uuid('owner_user_id')->nullable();

                // JSONB fields (added via raw statements to guarantee jsonb in Postgres)
                // candidate_assignees JSONB
                // source_spans JSONB
                // embedding vector(1024) added later

                $table->timestampTz('due_at')->nullable();
                $table->decimal('confidence', 4, 3)->nullable();

                $table->timestampTz('first_seen_at');
                $table->timestampTz('last_seen_at');

                $table->string('canonical_hash', 64)->unique();
                $table->timestampsTz();

                // FKs
                $table->foreign('pulse_id')->references('id')->on('pulses')->onDelete('cascade');
                $table->foreign('meeting_id')->references('id')->on('meetings')->onDelete('cascade');
                $table->foreign('owner_user_id')->references('id')->on('users')->onDelete('set null');
            });

            // Add CHECK constraints, JSONB columns, and vector column
            DB::statement("ALTER TABLE kb_facts
                ADD CONSTRAINT kb_facts_type_check CHECK (type IN ('action','decision','risk'))");
            DB::statement("ALTER TABLE kb_facts
                ADD CONSTRAINT kb_facts_status_check CHECK (status IN ('open','closed'))");

            DB::statement("ALTER TABLE kb_facts ADD COLUMN candidate_assignees JSONB");
            DB::statement("ALTER TABLE kb_facts ADD COLUMN source_spans JSONB");

            // Titan v2 uses 1024 dims by default
            DB::statement("ALTER TABLE kb_facts ADD COLUMN embedding vector(1024)");

            // Helpful indexes
            DB::statement("CREATE INDEX kb_facts_pulse_type_idx ON kb_facts (pulse_id, type, last_seen_at DESC)");
            DB::statement("CREATE INDEX kb_facts_hash_idx ON kb_facts (canonical_hash)");

            // ANN index (IVFFLAT, cosine). You can tune lists later (start ~200).
            DB::statement("
                CREATE INDEX kb_facts_embedding_ivfflat
                ON kb_facts USING ivfflat (embedding vector_cosine_ops)
                WITH (lists = 200)
            ");
        }

        /**
         * kb_fact_links
         * If table already exists, skip everything for this table.
         */
        if (!Schema::hasTable('kb_fact_links')) {
            Schema::create('kb_fact_links', function (Blueprint $table) {
                $table->uuid('fact_id'); // FK -> kb_facts(id)
                $table->text('to_type'); // CHECK enum below
                $table->text('to_id');   // flexible (uuid, string, etc.)
                $table->text('relation'); // CHECK enum below
                $table->decimal('weight', 4, 3)->nullable();
                $table->timestampsTz();

                $table->primary(['fact_id', 'to_type', 'to_id', 'relation']);
                $table->foreign('fact_id')->references('id')->on('kb_facts')->onDelete('cascade');
            });

            DB::statement("ALTER TABLE kb_fact_links
                ADD CONSTRAINT kb_fact_links_to_type_check
                CHECK (to_type IN ('user','pulse','topic','doc','task'))");
            DB::statement("ALTER TABLE kb_fact_links
                ADD CONSTRAINT kb_fact_links_relation_check
                CHECK (relation IN ('assigned_to','requested_by','decided_by','mentions','duplicates','affects'))");
        }

        /**
         * kb_entities (optional)
         * If table already exists, skip everything for this table.
         */
        if (!Schema::hasTable('kb_entities')) {
            Schema::create('kb_entities', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->uuid('pulse_id');      // FK -> pulses(id)
                $table->text('kind');          // CHECK below
                $table->text('name');
                // aliases JSONB, embedding vector(1024) via raw statements
                $table->timestampsTz();

                $table->foreign('pulse_id')->references('id')->on('pulses')->onDelete('cascade');
            });

            DB::statement("ALTER TABLE kb_entities
                ADD CONSTRAINT kb_entities_kind_check
                CHECK (kind IN ('customer','feature','project','metric','topic','doc'))");

            DB::statement("ALTER TABLE kb_entities ADD COLUMN aliases JSONB");
            DB::statement("ALTER TABLE kb_entities ADD COLUMN embedding vector(1024)");
            DB::statement("
                CREATE INDEX kb_entities_embedding_ivfflat
                ON kb_entities USING ivfflat (embedding vector_cosine_ops)
                WITH (lists = 100)
            ");
        }

        /**
         * Alter live_insight_outbox to link facts + add metadata
         * (kept minimal safeguards so re-running doesn’t explode)
         */
        if (Schema::hasTable('live_insight_outbox')) {
            Schema::table('live_insight_outbox', function (Blueprint $table) {
                if (!Schema::hasColumn('live_insight_outbox', 'kb_fact_id')) {
                    $table->uuid('kb_fact_id')->nullable()->after('user_id');
                }
                if (!Schema::hasColumn('live_insight_outbox', 'confidence')) {
                    $table->decimal('confidence', 4, 3)->nullable()->after('kb_fact_id');
                }
            });

            if (!Schema::hasColumn('live_insight_outbox', 'evidence')) {
                DB::statement("ALTER TABLE live_insight_outbox ADD COLUMN evidence JSONB");
            }

            // Add FK only if not already present
            $fkExists = DB::selectOne("
                SELECT 1
                FROM pg_constraint
                WHERE conname = 'live_insight_outbox_kb_fact_fk'
            ");
            if (!$fkExists) {
                DB::statement("
                    ALTER TABLE live_insight_outbox
                    ADD CONSTRAINT live_insight_outbox_kb_fact_fk
                    FOREIGN KEY (kb_fact_id) REFERENCES kb_facts(id) ON DELETE SET NULL
                ");
            }
        }

        // (Optional) runtime knobs used by ANN queries
        // SET enable_seqscan = off;
        // SET ivfflat.probes = 10;
    }

    public function down(): void
    {
        // Drop outbox alterations
        DB::statement("ALTER TABLE live_insight_outbox DROP CONSTRAINT IF EXISTS live_insight_outbox_kb_fact_fk");
        DB::statement("ALTER TABLE live_insight_outbox DROP COLUMN IF EXISTS evidence");
        if (Schema::hasTable('live_insight_outbox')) {
            Schema::table('live_insight_outbox', function (Blueprint $table) {
                if (Schema::hasColumn('live_insight_outbox', 'confidence')) {
                    $table->dropColumn('confidence');
                }
                if (Schema::hasColumn('live_insight_outbox', 'kb_fact_id')) {
                    $table->dropColumn('kb_fact_id');
                }
            });
        }

        // Drop kb_entities (+ index)
        DB::statement("DROP INDEX IF EXISTS kb_entities_embedding_ivfflat");
        Schema::dropIfExists('kb_entities');

        // Drop kb_fact_links
        Schema::dropIfExists('kb_fact_links');

        // Drop kb_facts (+ indexes)
        DB::statement("DROP INDEX IF EXISTS kb_facts_embedding_ivfflat");
        DB::statement("DROP INDEX IF EXISTS kb_facts_pulse_type_idx");
        DB::statement("DROP INDEX IF EXISTS kb_facts_hash_idx");
        Schema::dropIfExists('kb_facts');
    }
};
