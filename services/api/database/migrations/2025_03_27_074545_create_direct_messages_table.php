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
        Schema::create('direct_messages', function (Blueprint $table) {
            // UUID primary key.
            $table->uuid('id')->primary();
            // Foreign key referencing direct_message_threads.
            $table->uuid('direct_message_thread_id');
            // Foreign key referencing users (sender).
            $table->uuid('sender_id');
            // The content of the message.
            $table->text('content');
            $table->timestamps();

            // Add foreign key constraints.
            $table
                ->foreign('direct_message_thread_id')
                ->references('id')
                ->on('direct_message_threads')
                ->onDelete('cascade');

            $table
                ->foreign('sender_id')
                ->references('id')
                ->on('users')
                ->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('direct_messages');
    }
};
