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
        Schema::table('tasks', function (Blueprint $table) {
            // Add composite indexes for filtering optimization
            // These indexes help with exclude filters that check both parent and child tasks
            $table->index(['parent_id', 'status'], 'idx_tasks_parent_status');
            $table->index(
                ['parent_id', 'priority'],
                'idx_tasks_parent_priority'
            );
            // Note: organization_id + status already indexed in 2026_01_05_083104_add_indexing_to_tasks_table.php
            $table->index(
                ['organization_id', 'priority'],
                'idx_tasks_org_priority'
            );
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            $table->dropIndex('idx_tasks_parent_status');
            $table->dropIndex('idx_tasks_parent_priority');
            $table->dropIndex('idx_tasks_org_priority');
        });
    }
};
