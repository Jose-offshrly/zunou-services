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
        Schema::table('kb_facts', function (Blueprint $table) {
            $table->index(
                ['updated_at', 'last_seen_at'],
                'kb_facts_updated_last_seen_at_index'
            );
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('kb_facts', function (Blueprint $table) {
            $table->dropIndex('kb_facts_updated_last_seen_at_index');
        });
    }
};
