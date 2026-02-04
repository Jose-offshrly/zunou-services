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
        Schema::create('team_message_reactions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('team_message_id');
            $table->uuid('user_id');
            $table->string('reaction');
            $table->timestamps();

            $table
                ->foreign('team_message_id')
                ->references('id')
                ->on('team_messages')
                ->onDelete('cascade');
            $table
                ->foreign('user_id')
                ->references('id')
                ->on('users')
                ->onDelete('cascade');

            $table->unique(['team_message_id', 'user_id', 'reaction']);
            $table->index(['team_message_id', 'reaction']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('team_message_reactions');
    }
};
