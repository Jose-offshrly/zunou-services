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
        Schema::table('meeting_sessions', function (Blueprint $table) {
            $table->uuid('data_source_id')->nullable();

            $table
                ->foreign('data_source_id')
                ->references('id')
                ->on('data_sources')
                ->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('meeting_sessions', function (Blueprint $table) {
            $table->dropForeign(['data_source_id']);
            $table->dropColumn('data_source_id');
        });
    }
};
