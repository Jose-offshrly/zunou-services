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
        Schema::create('direct_message_reads', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('direct_message_id');
            $table->uuid('user_id');
            $table->timestamps();

            // Add foreign key constraints
            $table
                ->foreign('direct_message_id')
                ->references('id')
                ->on('direct_messages')
                ->onDelete('cascade');

            $table
                ->foreign('user_id')
                ->references('id')
                ->on('users')
                ->onDelete('cascade');

            // Add unique constraint to prevent duplicate reads
            $table->unique(['direct_message_id', 'user_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('direct_message_reads');
    }
};
