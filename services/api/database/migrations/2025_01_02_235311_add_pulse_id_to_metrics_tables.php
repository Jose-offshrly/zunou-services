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
        Schema::table('monthly_summaries', function (Blueprint $table) {
            $table->uuid('pulse_id')->nullable();

            // Foreign key constraint to ensure pulse exists
            $table
                ->foreign('pulse_id')
                ->references('id')
                ->on('pulses')
                ->onDelete('cascade');

            $table->dropUnique(['organization_id', 'month', 'year']);

            // Ensure no duplicate summaries for the same pulse, month, and year
            $table->unique(['pulse_id', 'month', 'year']);
        });

        Schema::table('monthly_time_saved', function (Blueprint $table) {
            $table->uuid('pulse_id')->nullable();

            // Foreign key constraint to ensure pulse exists
            $table
                ->foreign('pulse_id')
                ->references('id')
                ->on('pulses')
                ->onDelete('cascade');

            $table->dropUnique(['organization_id', 'month', 'year']);

            // Ensure no duplicate summaries for the same pulse, month, and year
            $table->unique(['pulse_id', 'month', 'year']);
        });

        Schema::table('monthly_questions', function (Blueprint $table) {
            $table->uuid('pulse_id')->nullable();

            // Foreign key constraint to ensure pulse exists
            $table
                ->foreign('pulse_id')
                ->references('id')
                ->on('pulses')
                ->onDelete('cascade');
        });

        Schema::table('monthly_trending_topics', function (Blueprint $table) {
            $table->uuid('pulse_id')->nullable();

            // Foreign key constraint to ensure pulse exists
            $table
                ->foreign('pulse_id')
                ->references('id')
                ->on('pulses')
                ->onDelete('cascade');

            $table->dropUnique(['organization_id', 'month', 'year', 'rank']);

            // Ensure no duplicate summaries for the same pulse, month, and year
            $table->unique(['pulse_id', 'month', 'year', 'rank']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('monthly_summaries', function (Blueprint $table) {
            $table->dropForeign(['pulse_id']);
            $table->dropColumn('pulse_id');
        });

        Schema::table('monthly_time_saved', function (Blueprint $table) {
            $table->dropForeign(['pulse_id']);
            $table->dropColumn('pulse_id');
        });

        Schema::table('monthly_questions', function (Blueprint $table) {
            $table->dropForeign(['pulse_id']);
            $table->dropColumn('pulse_id');
        });

        Schema::table('monthly_trending_topics', function (Blueprint $table) {
            $table->dropForeign(['pulse_id']);
            $table->dropColumn('pulse_id');
        });
    }
};
