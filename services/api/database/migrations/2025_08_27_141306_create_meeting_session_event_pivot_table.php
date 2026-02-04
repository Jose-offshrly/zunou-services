<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class () extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('event_meeting_session', function (Blueprint $table) {
            $table->uuid('meeting_session_id');
            $table->uuid('event_id');

            $table
                ->foreign('meeting_session_id')
                ->references('id')
                ->on('meeting_sessions')
                ->onDelete('cascade');

            $table
                ->foreign('event_id')
                ->references('id')
                ->on('events')
                ->onDelete('cascade');

            $table->primary(['meeting_session_id', 'event_id']);
            $table->timestamps();

        });

        Schema::table('events', function (Blueprint $table) {
            $table->uuid('current_meeting_session_id')->nullable();

            $table
                ->foreign('current_meeting_session_id')
                ->references('id')
                ->on('meeting_sessions')
                ->onDelete('cascade');
        });

    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('event_meeting_session');
        Schema::table('events', function (Blueprint $table) {
            $table->dropForeign(['current_meeting_session_id']);
            $table->dropColumn('current_meeting_session_id');
        });
    }
};
