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
            $table->uuid('event_source_id')->nullable()->after('google_event_id');
            $table->foreign('event_source_id')->references('id')->on('event_sources')->onDelete('set null');
            $table->index('event_source_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('events', function (Blueprint $table) {
            $table->dropForeign(['event_source_id']);
            $table->dropIndex(['event_source_id']);
            $table->dropColumn('event_source_id');
        });
    }
};
