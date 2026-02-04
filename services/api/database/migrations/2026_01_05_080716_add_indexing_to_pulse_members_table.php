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
        Schema::table('pulse_members', function (Blueprint $table) {
            $table->index(
                ['pulse_id', 'user_id'],
                'pulse_members_pulse_user_index'
            );
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('pulse_members', function (Blueprint $table) {
            $table->dropIndex('pulse_members_pulse_user_index');
        });
    }
};
