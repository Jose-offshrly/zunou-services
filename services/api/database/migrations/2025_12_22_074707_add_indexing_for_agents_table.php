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
        Schema::table('agents', function (Blueprint $table) {
            // Optimizes the `agents` and `agent` GraphQL queries:
            // WHERE organization_id = ? AND pulse_id = ? [AND name LIKE ...]
            $table->index(
                ['organization_id', 'pulse_id'],
                'agents_org_pulse_index'
            );
        });

        Schema::table('ai_agents', function (Blueprint $table) {
            // Optimizes the `aiAgents` and `aiAgent` GraphQL queries:
            // WHERE pulse_id = ? AND organization_id = ?
            $table->index(
                ['pulse_id', 'organization_id'],
                'ai_agents_pulse_org_index'
            );
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('agents', function (Blueprint $table) {
            $table->dropIndex('agents_org_pulse_index');
        });

        Schema::table('ai_agents', function (Blueprint $table) {
            $table->dropIndex('ai_agents_pulse_org_index');
        });
    }
};
