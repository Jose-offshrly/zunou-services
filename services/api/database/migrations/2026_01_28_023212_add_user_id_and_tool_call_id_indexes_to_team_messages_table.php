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
        Schema::table('team_messages', function (Blueprint $table) {
            $table->index('user_id', 'team_messages_user_index');
            $table->index('tool_call_id', 'team_messages_tool_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('team_messages', function (Blueprint $table) {
            $table->dropIndex('team_messages_user_index');
            $table->dropIndex('team_messages_tool_index');
        });
    }
};
