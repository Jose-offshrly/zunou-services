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
        Schema::table('scheduled_jobs', function (Blueprint $table) {
            $table->index(
                ['on_queue', 'next_run_at'],
                'scheduled_jobs_on_queue_next_run_at_index'
            );
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('scheduled_jobs', function (Blueprint $table) {
            $table->dropIndex('scheduled_jobs_on_queue_next_run_at_index');
        });
    }
};
