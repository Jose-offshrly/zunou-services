<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class () extends Migration {
    /**
     * Run the migrations.
     *
     * Recurring event attendees are stored without an entity morph (they belong
     * to the series, not a specific instance), so entity_type and entity_id must
     * be nullable.
     */
    public function up(): void
    {
        Schema::table('attendees', function (Blueprint $table) {
            $table->string('entity_type')->nullable()->change();
            $table->uuid('entity_id')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('attendees', function (Blueprint $table) {
            $table->string('entity_type')->nullable(false)->change();
            $table->uuid('entity_id')->nullable(false)->change();
        });
    }
};
