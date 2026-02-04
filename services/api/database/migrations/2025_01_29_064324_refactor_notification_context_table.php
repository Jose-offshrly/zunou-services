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
        Schema::table('notification_context', function (Blueprint $table) {
            if (Schema::hasColumn('notification_context', 'data_source_id')) {
                $table->dropForeign(['data_source_id']);
                $table->dropColumn('data_source_id');
            }
            $table->uuid('summary_id')->nullable();

            $table
                ->foreign('summary_id')
                ->references('id')
                ->on('summaries')
                ->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('notification_context', function (Blueprint $table) {
            $table->uuid('data_source_id')->nullable();

            $table
                ->foreign('data_source_id')
                ->references('id')
                ->on('data_sources')
                ->onDelete('cascade');

            $table->dropForeign(['summary_id']);
            $table->dropColumn('summary_id');
        });
    }
};
