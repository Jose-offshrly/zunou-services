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
        Schema::table('live_insight_recommendations', function (
            Blueprint $table
        ) {
            $table->index(
                'is_executed',
                'live_insight_recommendations_is_executed_index'
            );
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('live_insight_recommendations', function (
            Blueprint $table
        ) {
            $table->dropIndex('live_insight_recommendations_is_executed_index');
        });
    }
};
