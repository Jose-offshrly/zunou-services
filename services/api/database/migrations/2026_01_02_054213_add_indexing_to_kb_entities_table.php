<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('kb_entities', function (Blueprint $table) {
            $table->index(['pulse_id', 'kind'], 'kb_entities_pulse_kind_index');
        });

        DB::statement("
            CREATE INDEX kb_entities_pulse_kind_lower_name_idx
            ON kb_entities (pulse_id, kind, lower(name))
        ");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement(
            'DROP INDEX IF EXISTS kb_entities_pulse_kind_lower_name_idx'
        );

        Schema::table('kb_entities', function (Blueprint $table) {
            $table->dropIndex('kb_entities_pulse_kind_index');
        });
    }
};
