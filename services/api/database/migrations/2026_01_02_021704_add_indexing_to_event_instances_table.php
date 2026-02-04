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
        Schema::table('event_instances', function (Blueprint $table) {
            $table->index(
                ['pulse_id', 'event_id'],
                'event_instances_pulse_event_index'
            );
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('event_instances', function (Blueprint $table) {
            $table->dropIndex('event_instances_pulse_event_index');
        });
    }
};
