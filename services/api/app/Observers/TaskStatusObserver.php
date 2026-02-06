<?php

namespace App\Observers;

use App\Jobs\UpdateTasksForDeletedTaskStatusJob;
use App\Models\Task;
use App\Models\TaskStatus;
use Illuminate\Contracts\Events\ShouldHandleEventsAfterCommit;
use Illuminate\Support\Facades\Log;

class TaskStatusObserver implements ShouldHandleEventsAfterCommit
{
    /**
     * Handle the TaskStatus "deleted" event.
     */
    public function deleting(TaskStatus $taskStatus): void
    {
        Log::info('TaskStatusObserver deleting called', [
            'status_id' => $taskStatus->id,
            'pulse_id'  => $taskStatus->pulse_id,
            'position'  => $taskStatus->position,
        ]);

        // Only process if the task status belongs to a pulse
        if (! $taskStatus->pulse_id || ! $taskStatus->position) {
            Log::info('TaskStatusObserver deleting skipped – missing pulse_id or position', [
                'status_id' => $taskStatus->id,
                'pulse_id'  => $taskStatus->pulse_id,
                'position'  => $taskStatus->position,
            ]);
            return;
        }

        $deletedPosition = $taskStatus->position;
        $pulseId         = $taskStatus->pulse_id;
        $deletedStatusId = $taskStatus->id;

        Log::info('TaskStatusObserver deleting processing', [
            'deleted_status_id' => $deletedStatusId,
            'pulse_id'          => $pulseId,
            'deleted_position'  => $deletedPosition,
        ]);

        // Resolve the replacement position for the deleted status:
        // - if the deleted position is 1, use position 2
        // - otherwise, use position - 1 for the same pulse
        $replacementPosition = $deletedPosition === 1
            ? 2
            : $deletedPosition - 1;

        Log::info('TaskStatusObserver replacement position resolved', [
            'deleted_position'     => $deletedPosition,
            'replacement_position' => $replacementPosition,
            'pulse_id'             => $pulseId,
        ]);

        // Find all tasks under this pulse that reference the deleted status
        // Note: we intentionally skip filtering by entity_type here to ensure
        // we don't miss tasks due to type mismatches.
        $tasks = Task::where('entity_id', $pulseId)
            ->where('task_status_id', $deletedStatusId)
            ->get();

        Log::info('Tasks found for TaskStatus deletion', [
            'deleted_status_id' => $deletedStatusId,
            'pulse_id'          => $pulseId,
            'tasks_found'       => $tasks->count(),
        ]);

        // Move the actual update work to a queued job, but
        // keep the querying of tasks here so we know exactly
        // which tasks we intend to update at delete-time.
        $taskIds = $tasks->pluck('id')->all();

        UpdateTasksForDeletedTaskStatusJob::dispatch(
            pulseId: $pulseId,
            deletedStatusId: (string) $deletedStatusId,
            deletedPosition: (int) $deletedPosition,
            replacementPosition: (int) $replacementPosition,
            taskIds: $taskIds,
        );
    }
}