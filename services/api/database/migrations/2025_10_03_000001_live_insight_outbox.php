<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class () extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('live_insight_outbox', function (Blueprint $table) {
            $table->bigIncrements('id');

            $table->string('item_hash', 64);
            $table->uuid('meeting_id');
            $table->uuid('pulse_id');
            $table->text('type'); // CHECK constraint added below
            $table->string('topic', 512)->nullable();
            $table->longText('description')->nullable();
            $table->longText('explanation')->nullable();
            $table->uuid('user_id');

            $table->text('delivery_status')->default('pending');
            $table->timestampTz('delivered_at')->nullable();
            $table->timestampTz('read_at')->nullable();

            // merged update:
            $table->timestampTz('closed_at')->nullable();
            $table->text('closed_reason')->nullable();

            $table->timestampsTz();

            // FKs
            $table->foreign('meeting_id')
                ->references('id')->on('meetings')
                ->onDelete('cascade');

            $table->foreign('pulse_id')
                ->references('id')->on('pulses')
                ->onDelete('cascade'); // <- NEW: cascade when parent pulse is deleted

            $table->foreign('user_id')
                ->references('id')->on('users')
                ->onDelete('cascade')
                ->onUpdate('cascade');

            // Unique for ON CONFLICT (item_hash, user_id)
            $table->unique(['item_hash', 'user_id'], 'live_insight_outbox_item_user_uidx');

            // Simple index
            $table->index('meeting_id', 'idx_live_insight_outbox_meeting_id');
        });

        // Postgres-only: CHECK constraint for type
        DB::statement("
            ALTER TABLE public.live_insight_outbox
            ADD CONSTRAINT live_insight_outbox_type_check
            CHECK (type IN ('action','decision','risk'))
        ");

        // Postgres-only: composite index with DESC on updated_at
        DB::statement("
            CREATE INDEX live_insight_outbox_pulse_type_idx
            ON public.live_insight_outbox USING btree (pulse_id, type, updated_at DESC)
        ");

        // Helpful inbox index
        DB::statement("
            CREATE INDEX live_insight_user_status_updated_idx
            ON public.live_insight_outbox (user_id, delivery_status, updated_at DESC)
        ");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('live_insight_outbox');

    }
};
