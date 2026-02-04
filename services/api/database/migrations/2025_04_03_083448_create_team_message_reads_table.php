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
        Schema::create('team_message_reads', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('team_message_id');
            $table->uuid('user_id');
            $table->timestamp('read_at');
            $table->timestamps();

            // Foreign key constraints
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

            // Unique constraint to prevent duplicate reads
            $table->unique(['team_message_id', 'user_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('team_message_reads');
    }
};
