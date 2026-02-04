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
        Schema::table('event_meeting_session', function (Blueprint $table) {
            $table->index('event_id', 'event_meeting_session_event_id_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('event_meeting_session', function (Blueprint $table) {
            $table->dropIndex('event_meeting_session_event_id_index');
        });
    }
};
