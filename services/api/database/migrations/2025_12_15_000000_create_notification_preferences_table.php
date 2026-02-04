<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class () extends Migration {
    public function up(): void
    {
        Schema::create('notification_preferences', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('user_id');
            $table->string('scope_type'); // global, pulse, topic
            $table->uuid('scope_id')->nullable();
            $table->string('mode'); // all, mentions, off
            $table->timestamps();

            $table->foreign('user_id')
                ->references('id')
                ->on('users')
                ->onDelete('cascade');

            // Index for quick lookups by user
            $table->index('user_id', 'notification_preferences_user_id_index');

            // Unique constraint to prevent duplicate preferences per user/scope_id
            $table->unique(
                ['user_id', 'scope_id'],
                'notification_preferences_user_scope_unique'
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notification_preferences');
    }
};
