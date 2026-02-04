<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Fixes slow activity_log queries found in Sentry.
     */
    public function up(): void
    {
        Schema::table('activity_log', function (Blueprint $table) {
            // Fix the 41s DISTINCT subject_type query (polymorphic eager loading)
            $table->index('subject_type', 'activity_log_subject_type_index');

            // Speed up ActivityLogParser lookups
            $table->index(
                ['pulse_id', 'causer_type', 'subject_type', 'subject_id', 'created_at'],
                'activity_log_pulse_causer_subject_created_at_index'
            );

            // Speed up feed queries without pulse_id filter
            $table->index(
                ['organization_id', 'receiver_id', 'created_at'],
                'activity_log_org_receiver_created_at_index'
            );
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('activity_log', function (Blueprint $table) {
            $table->dropIndex('activity_log_subject_type_index');
            $table->dropIndex('activity_log_pulse_causer_subject_created_at_index');
            $table->dropIndex('activity_log_org_receiver_created_at_index');
        });
    }
};
