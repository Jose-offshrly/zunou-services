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
        Schema::table('misalignment_alerts', function (Blueprint $table) {
            $table->index(
                ['organization_id', 'acknowledged'],
                'misalignment_alerts_org_acknowledged_index'
            );
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('misalignment_alerts', function (Blueprint $table) {
            $table->dropIndex('misalignment_alerts_org_acknowledged_index');
        });
    }
};
