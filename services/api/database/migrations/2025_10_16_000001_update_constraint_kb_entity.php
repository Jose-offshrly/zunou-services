<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;

return new class () extends Migration {
    public function up(): void
    {
        if (!Schema::hasTable('kb_fact_links')) {
            return;
        }

        DB::statement("
            ALTER TABLE kb_fact_links
            DROP CONSTRAINT IF EXISTS kb_fact_links_to_type_check
        ");

        DB::statement("
            ALTER TABLE kb_fact_links
            ADD CONSTRAINT kb_fact_links_to_type_check
            CHECK (to_type IN ('user','entity','kb_entity','pulse','meeting','topic','doc','task'))
        ");

        // Helpful indexes (idempotent)
        DB::statement("
            CREATE INDEX IF NOT EXISTS kb_links_type_toid_idx
            ON kb_fact_links (to_type, to_id)
        ");
        DB::statement("
            CREATE INDEX IF NOT EXISTS kb_links_fact_relation_idx
            ON kb_fact_links (fact_id, relation)
        ");

        if (!Schema::hasTable('live_insight_outbox')) {
            return;
        }

        Schema::table('live_insight_outbox', function (Blueprint $table) {
            if (!Schema::hasColumn('live_insight_outbox', 'seen_at')) {
                $table->timestampTz('seen_at')->nullable()->after('delivered_at');
            }
            if (!Schema::hasColumn('live_insight_outbox', 'feedback')) {
                $table->longText('feedback')->nullable()->after('explanation');
            }
            if (!Schema::hasColumn('live_insight_outbox', 'accepted')) {
                $table->boolean('accepted')->nullable()->after('delivery_status');
            }
            if (!Schema::hasColumn('live_insight_outbox', 'owner_correct')) {
                $table->boolean('owner_correct')->nullable()->after('accepted');
            }
        });

        // One-time backfill: if seen_at is null, copy read_at
        DB::statement("
            UPDATE live_insight_outbox
            SET seen_at = read_at
            WHERE seen_at IS NULL AND read_at IS NOT NULL
        ");

        // Index to speed nightly stats by user/topic
        DB::statement("
            CREATE INDEX IF NOT EXISTS live_insight_user_topic_idx
            ON public.live_insight_outbox (user_id, type, topic, updated_at DESC)
        ");
    }

    public function down(): void
    {
        if (!Schema::hasTable('kb_fact_links')) {
            return;
        }

        DB::statement("
            ALTER TABLE kb_fact_links
            DROP CONSTRAINT IF EXISTS kb_fact_links_to_type_check
        ");
        DB::statement("
            ALTER TABLE kb_fact_links
            ADD CONSTRAINT kb_fact_links_to_type_check
            CHECK (to_type IN ('user','pulse','topic','doc','task'))
        ");
        DB::statement("DROP INDEX IF EXISTS kb_links_type_toid_idx");
        DB::statement("DROP INDEX IF EXISTS kb_links_fact_relation_idx");

        if (!Schema::hasTable('live_insight_outbox')) {
            return;
        }

        DB::statement("DROP INDEX IF EXISTS live_insight_user_topic_idx");

        Schema::table('live_insight_outbox', function (Blueprint $table) {
            if (Schema::hasColumn('live_insight_outbox', 'owner_correct')) {
                $table->dropColumn('owner_correct');
            }
            if (Schema::hasColumn('live_insight_outbox', 'accepted')) {
                $table->dropColumn('accepted');
            }
            if (Schema::hasColumn('live_insight_outbox', 'feedback')) {
                $table->dropColumn('feedback');
            }
            if (Schema::hasColumn('live_insight_outbox', 'seen_at')) {
                $table->dropColumn('seen_at');
            }
        });
    }
};
