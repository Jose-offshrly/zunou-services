<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class () extends Migration {
    public function up(): void
    {
        Schema::table('meeting_sessions', function (Blueprint $table) {
            $table->uuid('event_instance_id')->nullable()->after('event_id');

            $table
                ->foreign('event_instance_id')
                ->references('id')
                ->on('event_instances')
                ->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::table('meeting_sessions', function (Blueprint $table) {
            $table->dropForeign(['event_instance_id']);
            $table->dropColumn('event_instance_id');
        });
    }
};


