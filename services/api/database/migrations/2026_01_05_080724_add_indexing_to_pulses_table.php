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
        Schema::table('pulses', function (Blueprint $table) {
            $table->index(['organization_id', 'type'], 'pulses_org_type_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('pulses', function (Blueprint $table) {
            $table->dropIndex('pulses_org_type_index');
        });
    }
};
