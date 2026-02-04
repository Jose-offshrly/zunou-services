<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class () extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Drop the composite primary key constraint first
        Schema::table('organization_onboarding_status', function (
            Blueprint $table,
        ) {
            $table->dropPrimary(['organization_id', 'item_id']);
        });

        // Add the auto-incrementing id column as a new primary key
        Schema::table('organization_onboarding_status', function (
            Blueprint $table,
        ) {
            $table->bigIncrements('id');
            $table->unique(['organization_id', 'item_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('organization_onboarding_status', function (
            Blueprint $table,
        ) {
            // Drop the primary key
            $table->dropColumn('id');

            // Restore the composite primary key
            $table->primary(['organization_id', 'item_id']);
        });
    }
};
