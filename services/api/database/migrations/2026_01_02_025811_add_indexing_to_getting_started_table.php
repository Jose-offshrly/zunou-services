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
        Schema::table('getting_started', function (Blueprint $table) {
            $table->index(
                ['organization_id', 'pulse_id', 'status'],
                'getting_started_org_pulse_status_index'
            );
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('getting_started', function (Blueprint $table) {
            $table->dropIndex('getting_started_org_pulse_status_index');
        });
    }
};
