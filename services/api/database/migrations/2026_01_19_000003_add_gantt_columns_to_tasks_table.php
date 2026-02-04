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
        Schema::table('tasks', function (Blueprint $table) {
            $table->timestamp('start_date')->nullable();
            $table->foreignUuid('task_phase_id')->nullable()->constrained('task_phases')->nullOnDelete();
            $table->foreignUuid('task_status_id')->nullable()->constrained('task_statuses')->nullOnDelete();
            $table->string('progress')->nullable();
            $table->string('color')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            $table->dropForeign(['task_phase_id']);
            $table->dropForeign(['task_status_id']);
            $table->dropColumn([
                'start_date',
                'task_phase_id',
                'task_status_id',
                'progress',
                'color',
            ]);
        });
    }
};
