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
        Schema::table('actionables', function (Blueprint $table) {
            $table->index(
                ['organization_id', 'pulse_id', 'event_id', 'created_at'],
                'actionables_org_pulse_event_created_at_index'
            );
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('actionables', function (Blueprint $table) {
            $table->dropIndex('actionables_org_pulse_event_created_at_index');
        });
    }
};
