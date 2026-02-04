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
        Schema::table('meeting_sessions', function (Blueprint $table) {
            $table->index('status', 'meeting_sessions_status_index');
            $table->index('start_at', 'meeting_sessions_start_at_index');
            $table->index('type', 'meeting_sessions_type_index');
            $table->index(
                ['pulse_id', 'status', 'start_at'],
                'meeting_sessions_pulse_status_start_at_index'
            );
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('meeting_sessions', function (Blueprint $table) {
            $table->dropIndex('meeting_sessions_pulse_status_start_at_index');
            $table->dropIndex('meeting_sessions_type_index');
            $table->dropIndex('meeting_sessions_start_at_index');
            $table->dropIndex('meeting_sessions_status_index');
        });
    }
};
