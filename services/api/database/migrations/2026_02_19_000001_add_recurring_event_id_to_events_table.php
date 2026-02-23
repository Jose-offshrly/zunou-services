<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasColumn('events', 'recurring_event_id')) {
            return;
        }

        Schema::table('events', function (Blueprint $table) {
            $table->uuid('recurring_event_id')->nullable()->index();
            $table->foreign('recurring_event_id')->references('id')->on('recurring_events')->onDelete('set null');
        });
    }

    public function down(): void
    {
        if (!Schema::hasColumn('events', 'recurring_event_id')) {
            return;
        }

        Schema::table('events', function (Blueprint $table) {
            $table->dropForeign(['recurring_event_id']);
            $table->dropColumn('recurring_event_id');
        });
    }
};
