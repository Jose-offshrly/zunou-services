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
        Schema::table('team_messages', function (Blueprint $table) {
            $table->uuid('replied_to_message_id')->nullable();
            $table
                ->foreign('replied_to_message_id')
                ->references('id')
                ->on('team_messages')
                ->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('team_messages', function (Blueprint $table) {
            $table->dropForeign(['replied_to_message_id']);
            $table->dropColumn('replied_to_message_id');
        });
    }
};
