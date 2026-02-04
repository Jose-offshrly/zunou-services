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
        Schema::table('agendas', function (Blueprint $table) {
            // Optimizes the `agendas` GraphQL query:
            // WHERE organization_id = ? AND pulse_id = ? [AND event_id = ?]
            // ORDER BY position ASC
            $table->index(
                ['organization_id', 'pulse_id', 'event_id', 'position'],
                'agendas_org_pulse_event_position_index'
            );
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('agendas', function (Blueprint $table) {
            $table->dropIndex('agendas_org_pulse_event_position_index');
        });
    }
};
