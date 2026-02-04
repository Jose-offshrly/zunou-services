<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class () extends Migration {
    public function up()
    {
        // Add the new 'meeting_id' column with foreign key constraint
        Schema::table('meeting_sessions', function (Blueprint $table) {
            $table->uuid('internal_meeting_id')->nullable();

            $table
                ->foreign('internal_meeting_id')
                ->references('id')
                ->on('meetings')
                ->onDelete('cascade');
        });
    }

    public function down()
    {
        // Drop the FK and new 'meeting_id' column
        Schema::table('meeting_sessions', function (Blueprint $table) {
            $table->dropForeign(['internal_meeting_id']);
            $table->dropColumn('internal_meeting_id');
        });
    }
};
