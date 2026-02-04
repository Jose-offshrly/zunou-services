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
        Schema::create('reply_team_threads', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('team_thread_id');
            $table->timestamps();
            $table->softDeletes();

            // Foreign key constraints
            $table
                ->foreign('team_thread_id')
                ->references('id')
                ->on('team_threads')
                ->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('reply_team_threads');
    }
};
