<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('notes', function (Blueprint $table) {
            // Add nullable pulse_id, organization_id, and user_id columns
            $table->uuid('pulse_id')->nullable()->after('id');
            $table->uuid('organization_id')->nullable()->after('pulse_id');
            $table->integer('position')->default(0)->after('organization_id');
            $table->uuid('user_id')->nullable()->after('position');

            // Add foreign key constraints
            $table->foreign('pulse_id')->references('id')->on('pulses')->onDelete('set null');
            $table->foreign('organization_id')->references('id')->on('organizations')->onDelete('set null');
            $table->foreign('user_id')->references('id')->on('users')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('notes', function (Blueprint $table) {
            $table->dropForeign(['pulse_id']);
            $table->dropForeign(['organization_id']);
            $table->dropForeign(['user_id']);
            $table->dropColumn(['pulse_id', 'organization_id', 'position', 'user_id']);
        });
    }
};
