<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('live_insight_outbox_recommendation', function (Blueprint $table) {
            $table->bigIncrements('id');

            $table->unsignedBigInteger('live_insight_outbox_id');
            $table->unsignedBigInteger('live_insight_recommendation_id');

            $table->foreign('live_insight_outbox_id')
                ->references('id')
                ->on('live_insight_outbox')
                ->onDelete('cascade');

            $table->foreign('live_insight_recommendation_id')
                ->references('id')
                ->on('live_insight_recommendations')
                ->onDelete('cascade');

            $table->unique(['live_insight_outbox_id', 'live_insight_recommendation_id']);
            $table->timestampsTz();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('live_insight_outbox_recommendation');
    }
};