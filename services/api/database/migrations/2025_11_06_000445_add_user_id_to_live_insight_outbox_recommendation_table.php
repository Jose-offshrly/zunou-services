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
        Schema::table('live_insight_outbox_recommendation', function (Blueprint $table) {
            // Add user_id column (nullable initially for existing records)
            $table->uuid('user_id')->nullable()->after('live_insight_recommendation_id');
        });

        // Populate existing records with user_id from outbox
        DB::statement("
            UPDATE live_insight_outbox_recommendation li_or
            SET user_id = (
                SELECT user_id 
                FROM live_insight_outbox lio 
                WHERE lio.id = li_or.live_insight_outbox_id
            )
        ");

        Schema::table('live_insight_outbox_recommendation', function (Blueprint $table) {
            // Make user_id required now that it's populated
            $table->uuid('user_id')->nullable(false)->change();

            $table->foreign('user_id')
                ->references('id')
                ->on('users')
                ->onDelete('cascade');

            $table->index(['user_id', 'live_insight_recommendation_id'], 'idx_pivot_user_recommendation');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('live_insight_outbox_recommendation', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
            $table->dropIndex('idx_pivot_user_recommendation');
            $table->dropColumn('user_id');
        });
    }
};
