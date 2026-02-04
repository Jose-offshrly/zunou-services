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
        Schema::table('summaries', function (Blueprint $table) {
            $table->string('name');
            $table->uuid('pulse_id');
            $table->timestamp('date');
            $table->string('attendees');
            $table->string('potential_strategies');

            $table
                ->foreign('pulse_id')
                ->references('id')
                ->on('pulses')
                ->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('summaries', function (Blueprint $table) {
            $table->dropColumn('name');
            $table->dropColumn('date');
            $table->dropColumn('attendees');
            $table->dropColumn('potential_strategies');
            $table->dropForeign(['pulse_id']);
            $table->dropColumn('pulse_id');
        });
    }
};
