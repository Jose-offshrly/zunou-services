<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class () extends Migration {
    public function up(): void
    {
        Schema::create('live_insight_feedback', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->bigInteger('outbox_id')->unsigned();
            $table->uuid('user_id');
            $table->smallInteger('rating'); // 1..5
            $table->jsonb('tags')->default(json_encode([]));
            $table->text('comment')->nullable();
            $table->timestampTz('created_at')->useCurrent();

            $table->foreign('outbox_id')->references('id')->on('live_insight_outbox')->onDelete('CASCADE');
            $table->foreign('user_id')->references('id')->on('users')->onDelete('CASCADE');

            $table->index(['outbox_id', 'created_at'], 'live_insight_feedback_outbox_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('live_insight_feedback');
    }
};
