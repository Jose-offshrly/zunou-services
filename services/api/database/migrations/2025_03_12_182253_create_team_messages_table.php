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
        Schema::create('team_messages', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('team_thread_id');
            $table->uuid('user_id');
            $table->uuid('thread_id')->nullable();
            $table->text('content')->nullable();
            $table->timestamps();
            $table->softDeletes();

            // Foreign key constraints
            $table
                ->foreign('team_thread_id')
                ->references('id')
                ->on('team_threads')
                ->onDelete('cascade');

            $table
                ->foreign('user_id')
                ->references('id')
                ->on('users')
                ->onDelete('cascade');

            $table
                ->foreign('thread_id')
                ->references('id')
                ->on('threads')
                ->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('team_messages');
    }
};
