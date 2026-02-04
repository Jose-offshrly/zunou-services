<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('team_chat_system_messages', function (Blueprint $table) {
            $table->uuid('topic_id')->nullable();
            $table
                ->foreign('topic_id')
                ->references('id')
                ->on('topics')
                ->onDelete('set null');
            $table->index('topic_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('team_chat_system_messages', function (Blueprint $table) {
            $table->dropForeign(['topic_id']);
            $table->dropIndex(['topic_id']);
            $table->dropColumn('topic_id');
        });
    }
};
