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
            $table->index(
                ['organization_id', 'entity_id'],
                'tasks_org_entity_index'
            );
            $table->index(
                ['organization_id', 'entity_id', 'type'],
                'tasks_org_entity_type_index'
            );
            $table->index(
                ['organization_id', 'status'],
                'tasks_org_status_index'
            );
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            $table->dropIndex('tasks_org_status_index');
            $table->dropIndex('tasks_org_entity_type_index');
            $table->dropIndex('tasks_org_entity_index');
        });
    }
};
