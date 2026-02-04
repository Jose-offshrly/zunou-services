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
        Schema::create('system_messages', function (Blueprint $table) {
            $table->id();
            $table->uuid('system_thread_id')->index(); // Links to system_threads
            $table->string('role'); // e.g., 'assistant', 'system'
            $table->text('content')->nullable(); // Content can now be nullable
            $table->json('metadata')->nullable(); // JSON for additional data
            $table->json('tool_calls')->nullable(); // JSON field for tool calls
            $table->string('tool_call_id')->nullable(); // Identifier for specific tool call
            $table->boolean('is_system')->default(false); // Flag to indicate system message
            $table->timestamps();

            // Define foreign key with cascading deletes for system_thread_id
            $table
                ->foreign('system_thread_id')
                ->references('id')
                ->on('system_threads')
                ->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('system_messages');
    }
};
