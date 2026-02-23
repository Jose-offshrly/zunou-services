<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('events', function (Blueprint $table) {
            // Drop the existing foreign key with cascade
            $table->dropForeign(['current_meeting_session_id']);
            
            // Re-add the foreign key with SET NULL on delete
            $table
                ->foreign('current_meeting_session_id')
                ->references('id')
                ->on('meeting_sessions')
                ->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::table('events', function (Blueprint $table) {
            // Drop the new foreign key
            $table->dropForeign(['current_meeting_session_id']);
            
            // Restore the old foreign key with cascade
            $table
                ->foreign('current_meeting_session_id')
                ->references('id')
                ->on('meeting_sessions')
                ->onDelete('cascade');
        });
    }
};
