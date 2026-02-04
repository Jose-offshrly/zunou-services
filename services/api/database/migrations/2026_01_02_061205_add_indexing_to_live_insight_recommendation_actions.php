<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('live_insight_recommendation_actions', function (
            Blueprint $table
        ) {
            $table->index(
                'status',
                'live_insight_recommendation_actions_status_index'
            );
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('live_insight_recommendation_actions', function (
            Blueprint $table
        ) {
            $table->dropIndex(
                'live_insight_recommendation_actions_status_index'
            );
        });
    }
};
