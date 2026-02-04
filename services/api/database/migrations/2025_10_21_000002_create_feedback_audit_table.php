<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Create feedback audit table to track feedback history.
     */
    public function up(): void
    {
        Schema::create('live_insight_feedback_audit', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->bigInteger('feedback_id')->unsigned();
            $table->bigInteger('outbox_id')->unsigned();
            $table->uuid('user_id');
            $table->smallInteger('rating'); // 1..5
            $table->jsonb('tags')->default(json_encode([]));
            $table->text('comment')->nullable();
            $table->string('action', 20); // 'created', 'updated', 'deleted'
            $table->timestampTz('created_at')->useCurrent();

            // Foreign keys
            $table->foreign('feedback_id')->references('id')->on('live_insight_feedback')->onDelete('CASCADE');
            $table->foreign('outbox_id')->references('id')->on('live_insight_outbox')->onDelete('CASCADE');
            $table->foreign('user_id')->references('id')->on('users')->onDelete('CASCADE');

            // Indexes for performance
            $table->index(['feedback_id', 'created_at'], 'feedback_audit_feedback_idx');
            $table->index(['outbox_id', 'created_at'], 'feedback_audit_outbox_idx');
            $table->index(['user_id', 'created_at'], 'feedback_audit_user_idx');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('live_insight_feedback_audit');
    }
};
