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
        Schema::table('live_insight_outbox', function (Blueprint $table) {
            $table->timestampTz('remind_at')->nullable();
            $table->integer('snooze_count')->default(0);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('live_insight_outbox', function (Blueprint $table) {
            $table->dropColumn(['remind_at', 'snooze_count']);
        });
    }
};
