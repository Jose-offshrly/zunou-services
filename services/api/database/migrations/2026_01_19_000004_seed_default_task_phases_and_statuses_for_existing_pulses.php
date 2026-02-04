<?php

use App\Models\Pulse;
use App\Models\TaskPhase;
use App\Models\TaskStatus;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Str;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $defaultPhases = [
            ['label' => 'Not Started', 'color' => '#6B7280'],
            ['label' => 'In Progress', 'color' => '#3B82F6'],
            ['label' => 'Completed', 'color' => '#10B981'],
            ['label' => 'Blocked', 'color' => '#EF4444'],
            ['label' => 'On Hold', 'color' => '#F59E0B'],
            ['label' => 'Overdue', 'color' => '#DC2626'],
        ];

        $defaultStatuses = [
            ['label' => 'Planning', 'color' => '#8B5CF6'],
            ['label' => 'Design', 'color' => '#EC4899'],
            ['label' => 'Development', 'color' => '#3B82F6'],
            ['label' => 'Testing', 'color' => '#F59E0B'],
            ['label' => 'Deployment', 'color' => '#10B981'],
            ['label' => 'Maintenance', 'color' => '#6B7280'],
        ];

        // Get all existing pulses that don't have task phases yet
        Pulse::whereDoesntHave('taskPhases')->chunk(100, function ($pulses) use ($defaultPhases) {
            foreach ($pulses as $pulse) {
                foreach ($defaultPhases as $phase) {
                    TaskPhase::create([
                        'id'       => Str::uuid(),
                        'pulse_id' => $pulse->id,
                        'label'    => $phase['label'],
                        'color'    => $phase['color'],
                    ]);
                }
            }
        });

        // Get all existing pulses that don't have task statuses yet
        Pulse::whereDoesntHave('taskStatuses')->chunk(100, function ($pulses) use ($defaultStatuses) {
            foreach ($pulses as $pulse) {
                foreach ($defaultStatuses as $status) {
                    TaskStatus::create([
                        'id'       => Str::uuid(),
                        'pulse_id' => $pulse->id,
                        'label'    => $status['label'],
                        'color'    => $status['color'],
                    ]);
                }
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // This migration seeds data, so we don't remove it on rollback
        // to avoid accidental data loss of user-customized phases/statuses
    }
};
