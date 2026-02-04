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
        Schema::table('task_statuses', function (Blueprint $table) {
            // Drop the foreign key constraint first
            $table->dropForeign(['pulse_id']);
            
            // Make pulse_id nullable
            $table->uuid('pulse_id')->nullable()->change();
            
            // Re-add the foreign key constraint (nullable)
            $table->foreign('pulse_id')->references('id')->on('pulses')->cascadeOnDelete();
            
            // Add type column
            $table->string('type')->nullable()->after('pulse_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('task_statuses', function (Blueprint $table) {
            // Drop the type column
            $table->dropColumn('type');
            
            // Drop the foreign key constraint
            $table->dropForeign(['pulse_id']);
            
            // Make pulse_id not nullable again
            $table->uuid('pulse_id')->nullable(false)->change();
            
            // Re-add the foreign key constraint (not nullable)
            $table->foreign('pulse_id')->references('id')->on('pulses')->cascadeOnDelete();
        });
    }
};
