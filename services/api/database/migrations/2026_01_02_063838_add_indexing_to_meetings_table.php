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
        Schema::table('meetings', function (Blueprint $table) {
            $table->index('status', 'meetings_status_index');
            $table->index('date', 'meetings_date_index');
            $table->index(
                ['pulse_id', 'user_id', 'date'],
                'meetings_pulse_user_date_index'
            );
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('meetings', function (Blueprint $table) {
            $table->dropIndex('meetings_pulse_user_date_index');
            $table->dropIndex('meetings_date_index');
            $table->dropIndex('meetings_status_index');
        });
    }
};
