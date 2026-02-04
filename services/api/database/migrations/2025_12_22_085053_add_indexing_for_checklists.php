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
        Schema::table('checklists', function (Blueprint $table) {
            // Optimizes the `checklists` GraphQL query:
            // WHERE organization_id = ? [AND pulse_id = ?] [AND event_id = ?]
            // ORDER BY position ASC
            $table->index(
                ['organization_id', 'pulse_id', 'event_id', 'position'],
                'checklists_org_pulse_event_position_index'
            );
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('checklists', function (Blueprint $table) {
            $table->dropIndex('checklists_org_pulse_event_position_index');
        });
    }
};
