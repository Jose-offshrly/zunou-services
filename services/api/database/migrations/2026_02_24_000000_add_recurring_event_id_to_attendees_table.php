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
        Schema::table('attendees', function (Blueprint $table) {
            $table->uuid('recurring_event_id')->nullable()->index()->after('user_id');

            $table
                ->foreign('recurring_event_id')
                ->references('id')
                ->on('recurring_events')
                ->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('attendees', function (Blueprint $table) {
            $table->dropForeign(['recurring_event_id']);
            $table->dropColumn('recurring_event_id');
        });
    }
};
