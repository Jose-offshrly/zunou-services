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
        // Create topics table (consolidated from 2025_10_26_193455_create_topics_table.php)
        Schema::create('topics', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('team_thread_id');
            $table->string('name');
            $table->uuid('created_by');
            $table->timestamps();
            $table->softDeletes();

            // Foreign key constraints
            $table
                ->foreign('team_thread_id')
                ->references('id')
                ->on('team_threads')
                ->onDelete('cascade');

            $table
                ->foreign('created_by')
                ->references('id')
                ->on('users')
                ->onDelete('cascade');

            // Indexes for better performance
            $table->index('team_thread_id');
            $table->index('created_by');
        });

        // Add topic_id to team_messages table (consolidated from 2025_10_26_193505_add_topic_id_to_team_messages_table.php)
        Schema::table('team_messages', function (Blueprint $table) {
            $table->uuid('topic_id')->nullable()->after('team_thread_id');
            
            // Foreign key constraint
            $table
                ->foreign('topic_id')
                ->references('id')
                ->on('topics')
                ->onDelete('set null');
            
            // Index for better performance
            $table->index('topic_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Drop topic_id from team_messages table
        Schema::table('team_messages', function (Blueprint $table) {
            $table->dropForeign(['topic_id']);
            $table->dropIndex(['topic_id']);
            $table->dropColumn('topic_id');
        });

        // Drop topics table
        Schema::dropIfExists('topics');
    }
};