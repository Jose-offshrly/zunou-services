<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Create insight_sources junction table for multi-source architecture.
     */
    public function up(): void
    {
        Schema::create('insight_sources', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->bigInteger('insight_id')->unsigned();
            $table->string('source_type', 50); // 'meeting', 'note', 'task', 'calendar', etc.
            $table->uuid('source_id');
            $table->decimal('contribution_weight', 3, 2)->default(1.00); // 0.00 to 1.00
            $table->timestamps();

            // Foreign keys
            $table->foreign('insight_id')->references('id')->on('live_insight_outbox')->onDelete('CASCADE');

            // Indexes for performance
            $table->index(['insight_id', 'source_type'], 'insight_sources_insight_type_idx');
            $table->index(['source_type', 'source_id'], 'insight_sources_source_idx');
            $table->index(['insight_id', 'created_at'], 'insight_sources_insight_created_idx');

            // Unique constraint to prevent duplicate source entries
            $table->unique(['insight_id', 'source_type', 'source_id'], 'insight_sources_unique_idx');
        });

        // Add CHECK constraint for contribution_weight
        DB::statement("
            ALTER TABLE insight_sources 
            ADD CONSTRAINT insight_sources_contribution_weight_check 
            CHECK (contribution_weight >= 0.00 AND contribution_weight <= 1.00)
        ");

        // Add CHECK constraint for source_type
        DB::statement("
            ALTER TABLE insight_sources 
            ADD CONSTRAINT insight_sources_source_type_check 
            CHECK (source_type IN ('meeting', 'note', 'task', 'calendar', 'document', 'email'))
        ");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('insight_sources');
    }
};
