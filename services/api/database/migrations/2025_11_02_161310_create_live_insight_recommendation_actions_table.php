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
        Schema::create('live_insight_recommendation_actions', function (Blueprint $table) {
            $table->id();
            $table->bigInteger('live_insight_recommendation_id');
            $table->string('type');
            $table->string('method');
            $table->json('data');
            $table->foreign('live_insight_recommendation_id')->references('id')->on('live_insight_recommendations')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('live_insight_recommendation_actions');
    }
};
