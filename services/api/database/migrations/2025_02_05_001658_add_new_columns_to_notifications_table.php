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
        Schema::table('notifications', function (Blueprint $table) {
            $table->uuid('organization_id')->nullable();
            $table->uuid('pulse_id')->nullable();
            $table->uuid('summary_id')->nullable();

            $table
                ->foreign('organization_id')
                ->references('id')
                ->on('organizations')
                ->onDelete('cascade');

            $table
                ->foreign('pulse_id')
                ->references('id')
                ->on('pulses')
                ->onDelete('cascade');

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
        Schema::table('notifications', function (Blueprint $table) {
            $table->dropForeign(['organization_id']);
            $table->dropForeign(['pulse_id']);
            $table->dropForeign(['summary_id']);

            $table->dropColumn('organization_id');
            $table->dropColumn('pulse_id');
            $table->dropColumn('summary_id');
        });
    }
};
