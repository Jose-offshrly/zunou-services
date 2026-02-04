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
        Schema::table('notes', function (Blueprint $table) {
            $table->index('pinned', 'notes_pinned_index');
            $table->index(
                ['organization_id', 'pulse_id', 'position'],
                'notes_org_pulse_position_index'
            );
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('notes', function (Blueprint $table) {
            $table->dropIndex('notes_org_pulse_position_index');
            $table->dropIndex('notes_pinned_index');
        });
    }
};
