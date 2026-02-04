<?php

namespace App\Jobs;

use App\Helpers\TaskStatusSyncHelper;
use App\Models\Pulse;
use App\Models\Task;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;

class ResyncTaskStatusesOnReorderJob implements ShouldQueue
{
    use Queueable;

    protected string $pulseId;

    /**
     * Create a new job instance.
     */
    public function __construct(string $pulseId)
    {
        $this->pulseId = $pulseId;
    }

    /**
     * Execute the job.
     * Re-sync all task enum statuses based on their current custom status position
     */
    public function handle(): void
    {
        $pulse = Pulse::find($this->pulseId);

        if (!$pulse) {
            Log::warning('Pulse not found for status re-sync', [
                'pulse_id' => $this->pulseId,
            ]);
            return;
        }

        // Only re-sync if pulse is using custom statuses
        if ($pulse->status_option?->value !== 'custom') {
            Log::info('Pulse not using custom statuses, skipping re-sync', [
                'pulse_id' => $this->pulseId,
            ]);
            return;
        }

        // Get all tasks for this pulse that have a custom status
        $tasks = Task::where('entity_id', $pulse->id)
            ->whereNotNull('task_status_id')
            ->with('taskStatus')
            ->get();

        Log::info('Re-syncing task enum statuses after custom status reorder', [
            'pulse_id' => $pulse->id,
            'tasks_count' => $tasks->count(),
        ]);

        $syncedCount = 0;
        foreach ($tasks as $task) {
            if (!$task->taskStatus) {
                continue;
            }

            // Only sync if it's a custom status for this pulse
            if (
                $task->taskStatus->pulse_id === $pulse->id &&
                $task->taskStatus->type === null
            ) {
                $oldStatus = $task->status;

                // Sync custom status to enum based on new position
                TaskStatusSyncHelper::syncCustomStatusToEnum($task);

                if ($oldStatus !== $task->status) {
                    $syncedCount++;

                    Log::debug('Re-synced task enum status', [
                        'task_id' => $task->id,
                        'old_status' => $oldStatus?->value,
                        'new_status' => $task->status?->value,
                        'custom_status_id' => $task->task_status_id,
                        'position' => $task->taskStatus->position,
                    ]);
                }
            }
        }

        Log::info('Completed re-sync of task enum statuses', [
            'pulse_id' => $pulse->id,
            'tasks_total' => $tasks->count(),
            'tasks_synced' => $syncedCount,
        ]);
    }
}
