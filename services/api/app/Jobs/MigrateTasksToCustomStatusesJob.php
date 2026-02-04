<?php

namespace App\Jobs;

use App\Enums\TaskStatus as TaskStatusEnum;
use App\Helpers\TaskStatusSyncHelper;
use App\Models\Pulse;
use App\Models\Task;
use App\Models\TaskStatus;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;

class MigrateTasksToCustomStatusesJob implements ShouldQueue
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
     */
    public function handle(): void
    {
        $pulse = Pulse::find($this->pulseId);

        if (!$pulse) {
            Log::warning('Pulse not found for migration', [
                'pulse_id' => $this->pulseId,
            ]);
            return;
        }

        // Get all tasks for this pulse (including tasks with null status or task_status_id)
        $tasks = Task::where('entity_id', $pulse->id)->get();

        Log::info(['TASKS TO UPDATE STATUS: ', $tasks->count()]);

        // Get custom statuses for this pulse
        $customStatuses = TaskStatus::where('pulse_id', $pulse->id)
            ->whereNull('type')
            ->orderBy('position')
            ->get();
        Log::info('CUSTOM STATUS: ', $customStatuses->toArray());

        if ($customStatuses->isEmpty()) {
            Log::warning('No custom statuses found for pulse', [
                'pulse_id' => $pulse->id,
            ]);
            return;
        }

        // Build semantic mapping: enum -> custom status ID
        $firstStatus = $customStatuses->first();
        $secondStatus =
            $customStatuses->count() >= 2
                ? $customStatuses->get(1)
                : $firstStatus;
        $lastStatus = $customStatuses->last();

        $enumToCustomMap = [
            TaskStatusEnum::TODO->value => $firstStatus->id,
            TaskStatusEnum::INPROGRESS->value => $secondStatus->id,
            TaskStatusEnum::COMPLETED->value => $lastStatus->id,
            TaskStatusEnum::OVERDUE->value => $secondStatus->id, // Treat OVERDUE as IN_PROGRESS
        ];

        Log::info('ENUM TO CUSTOM MAP: ', $enumToCustomMap);

        // Update each task using semantic mapping from enum status
        $migratedCount = 0;
        foreach ($tasks as $task) {
            // Skip if task has no enum status
            if (!$task->status) {
                continue;
            }

            $enumValue =
                $task->status instanceof TaskStatusEnum
                    ? $task->status->value
                    : $task->status;

            // Get the corresponding custom status ID
            $newStatusId = $enumToCustomMap[$enumValue] ?? $secondStatus->id;

            // Update task_status_id to match the enum status
            if ($task->task_status_id !== $newStatusId) {
                $task->update([
                    'task_status_id' => $newStatusId,
                ]);

                $migratedCount++;

                Log::debug('Migrated task to custom status', [
                    'task_id' => $task->id,
                    'pulse_id' => $pulse->id,
                    'enum_status' => $enumValue,
                    'new_status_id' => $newStatusId,
                ]);
            }
        }

        Log::info('Completed migration of tasks to custom statuses', [
            'pulse_id' => $pulse->id,
            'tasks_total' => $tasks->count(),
            'tasks_migrated' => $migratedCount,
        ]);
    }
}
