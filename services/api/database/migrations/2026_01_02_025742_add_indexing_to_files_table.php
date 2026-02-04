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
        Schema::table('files', function (Blueprint $table) {
            // Optimizes lookups of files by organization and pulse.
            // uuidMorphs already creates index on (entity_type, entity_id).
            $table->index(
                ['organization_id', 'pulse_id'],
                'files_org_pulse_index'
            );
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('files', function (Blueprint $table) {
            $table->dropIndex('files_org_pulse_index');
        });
    }
};
