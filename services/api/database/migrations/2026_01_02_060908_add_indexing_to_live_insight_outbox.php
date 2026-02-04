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
        Schema::table('live_insight_outbox', function (Blueprint $table) {
            $table->index(
                'is_bookmarked',
                'live_insight_outbox_is_bookmarked_index'
            );
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('live_insight_outbox', function (Blueprint $table) {
            $table->dropIndex('live_insight_outbox_is_bookmarked_index');
        });
    }
};
