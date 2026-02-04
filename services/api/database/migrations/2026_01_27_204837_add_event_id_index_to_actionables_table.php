<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Speed up `WHERE event_id IN (...)` queries on actionables.
     */
    public function up(): void
    {
        Schema::table('actionables', function (Blueprint $table) {
            $table->index('event_id', 'actionables_event_id_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('actionables', function (Blueprint $table) {
            $table->dropIndex('actionables_event_id_index');
        });
    }
};
