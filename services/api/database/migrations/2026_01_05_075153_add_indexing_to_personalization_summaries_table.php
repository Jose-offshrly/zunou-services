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
        Schema::table('personalization_summaries', function (Blueprint $table) {
            $table->index(
                ['user_id', 'pulse_id'],
                'personalization_summaries_user_pulse_index'
            );
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('personalization_summaries', function (Blueprint $table) {
            $table->dropIndex('personalization_summaries_user_pulse_index');
        });
    }
};
