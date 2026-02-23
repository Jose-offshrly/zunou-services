<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('notification_context', function (Blueprint $table) {
            $table->uuid('team_message_id')->nullable()->after('task_id');
            $table->foreign('team_message_id')->references('id')->on('team_messages')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::table('notification_context', function (Blueprint $table) {
            $table->dropForeign(['team_message_id']);
            $table->dropColumn('team_message_id');
        });
    }
};
