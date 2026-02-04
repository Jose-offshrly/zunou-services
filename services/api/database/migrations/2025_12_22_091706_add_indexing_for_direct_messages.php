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
        Schema::table('direct_messages', function (Blueprint $table) {
            // Optimizes fetching messages per thread ordered by time.
            $table->index(
                ['direct_message_thread_id', 'created_at'],
                'direct_messages_thread_created_at_index'
            );
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('direct_messages', function (Blueprint $table) {
            $table->dropIndex('direct_messages_thread_created_at_index');
        });
    }
};
