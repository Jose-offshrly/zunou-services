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
        Schema::table('backgrounds', function (Blueprint $table) {
            // Optimizes the `backgrounds` GraphQL query:
            // WHERE user_id = ? AND organization_id = ? [AND active = ?]
            $table->index(
                ['user_id', 'organization_id', 'active'],
                'backgrounds_user_org_active_index'
            );
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('backgrounds', function (Blueprint $table) {
            $table->dropIndex('backgrounds_user_org_active_index');
        });
    }
};
