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
        Schema::table('team_messages', function (Blueprint $table) {
            $table->string('role')->default('user');
            $table->json('tool_calls')->nullable(); // JSON field for tool calls
            $table->string('tool_call_id')->nullable(); // Identifier for specific tool call
            $table->boolean('is_system')->default(false); // Flag to indicate system message
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('team_messages', function (Blueprint $table) {
            $table->dropColumn([
                'role',
                'tool_calls',
                'tool_call_id',
                'is_system',
            ]);
        });
    }
};
