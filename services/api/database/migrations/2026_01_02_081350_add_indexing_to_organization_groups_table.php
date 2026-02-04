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
        Schema::table('organization_groups', function (Blueprint $table) {
            // Composite index for OrganizationGroupsQuery:
            // Filters by pulse_id, orders by created_at ASC
            $table->index(
                ['pulse_id', 'created_at'],
                'organization_groups_pulse_created_at_index'
            );
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('organization_groups', function (Blueprint $table) {
            $table->dropIndex('organization_groups_pulse_created_at_index');
        });
    }
};
