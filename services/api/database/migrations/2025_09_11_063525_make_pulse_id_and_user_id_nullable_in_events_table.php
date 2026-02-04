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
        Schema::table('events', function (Blueprint $table) {
            // Drop foreign key constraints first
            $table->dropForeign(['pulse_id']);
            $table->dropForeign(['user_id']);

            // Make columns nullable
            $table->uuid('pulse_id')->nullable()->change();
            $table->uuid('user_id')->nullable()->change();

            // Re-add foreign key constraints
            $table->foreign('pulse_id')->references('id')->on('pulses')->onDelete('set null');
            $table->foreign('user_id')->references('id')->on('users')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('events', function (Blueprint $table) {
            // Drop foreign key constraints first
            $table->dropForeign(['pulse_id']);
            $table->dropForeign(['user_id']);

            // Make columns non-nullable again
            $table->uuid('pulse_id')->nullable(false)->change();
            $table->uuid('user_id')->nullable(false)->change();

            // Re-add foreign key constraints with cascade delete
            $table->foreign('pulse_id')->references('id')->on('pulses')->onDelete('cascade');
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
        });
    }
};
