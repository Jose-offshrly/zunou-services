<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('recurring_event_instance_setups', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('recurring_event_id');
            $table->uuid('pulse_id');
            $table->json('setting')->nullable();
            $table->boolean('invite_notetaker');
            $table->timestamps();

            // Foreign keys
            $table->foreign('recurring_event_id')->references('id')->on('recurring_events')->onDelete('cascade');
            $table->foreign('pulse_id')->references('id')->on('pulses')->onDelete('cascade');

            // Prevent duplicate setups per (recurring_event, pulse)
            $table->unique(['recurring_event_id', 'pulse_id']);

            // Indexes for queries
            $table->index('pulse_id');
            $table->index('recurring_event_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('recurring_event_instance_setups');
    }
};
