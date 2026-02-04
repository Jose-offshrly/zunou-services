<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class () extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('scout_reminder_results', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->text('context_hash');
            $table->uuid('user_id');
            $table->uuid('organization_id');
            $table->uuid('pulse_id');
            $table->jsonb('event_ids')->nullable();
            $table->text('context')->nullable();
            $table->longText('result')->nullable(); // The generated reminder content
            $table->string('job_id')->nullable(); // Job ID for tracking
            $table->string('status')->default('processing');
            $table->text('error_message')->nullable();
            $table->timestamp('generated_at')->nullable();
            $table->timestamps();

            // Foreign key constraints
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('organization_id')->references('id')->on('organizations')->onDelete('cascade');
            $table->foreign('pulse_id')->references('id')->on('pulses')->onDelete('cascade');

            // Index for faster lookups
            $table->index(['user_id', 'organization_id', 'pulse_id']);
            $table->index(['status', 'generated_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('scout_reminder_results');
    }
};
