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
        Schema::table('automations', function (Blueprint $table) {
            // For quickly finding automations by strategy.
            $table->index(['strategy_id'], 'automations_strategy_id_index');

            // For scheduler-like scans of queued automations to run next.
            $table->index(
                ['on_queue', 'next_run_at'],
                'automations_on_queue_next_run_at_index'
            );
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('automations', function (Blueprint $table) {
            $table->dropIndex('automations_strategy_id_index');
            $table->dropIndex('automations_on_queue_next_run_at_index');
        });
    }
};
