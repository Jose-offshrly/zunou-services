<?php

namespace App\Jobs;

use App\Models\Task;
use App\Models\TaskStatus;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;

class UpdateTasksForDeletedTaskStatusJob implements ShouldQueue
{
    use Queueable;

    public function __construct(
        protected string $pulseId,
        protected string $deletedStatusId,
        protected int $deletedPosition,
        protected int $replacementPosition,
        protected array $taskIds,
    ) {
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        Log::info('UpdateTasksForDeletedTaskStatusJob started', [
            'pulse_id'              => $this->pulseId,
            'deleted_status_id'     => $this->deletedStatusId,
            'deleted_position'      => $this->deletedPosition,
            'replacement_position'  => $this->replacementPosition,
            'task_ids_count'        => count($this->taskIds),
        ]);

        if (empty($this->taskIds)) {
            Log::info('No tasks to update for deleted TaskStatus', [
                'pulse_id'          => $this->pulseId,
                'deleted_status_id' => $this->deletedStatusId,
            ]);

            return;
        }

        $replacementStatus = TaskStatus::where('pulse_id', $this->pulseId)
            ->where('position', $this->replacementPosition)
            ->first();

        if (! $replacementStatus) {
            Log::warning('No replacement TaskStatus found when running job', [
                'pulse_id'          => $this->pulseId,
                'deleted_status_id' => $this->deletedStatusId,
                'deleted_position'  => $this->deletedPosition,
                'target_position'   => $this->replacementPosition,
            ]);

            return;
        }

        $tasks = Task::whereIn('id', $this->taskIds)->get();

        Log::info('Tasks loaded in job for TaskStatus deletion', [
            'pulse_id'                 => $this->pulseId,
            'deleted_status_id'        => $this->deletedStatusId,
            'replacement_status_id'    => $replacementStatus->id,
            'expected_tasks_to_update' => count($this->taskIds),
            'actual_tasks_found'       => $tasks->count(),
        ]);

        $updatedCount = 0;

        foreach ($tasks as $task) {
            $task->update([
                'task_status_id' => $replacementStatus->id,
            ]);

            $updatedCount++;
        }

        Log::info('UpdateTasksForDeletedTaskStatusJob completed', [
            'pulse_id'              => $this->pulseId,
            'deleted_status_id'     => $this->deletedStatusId,
            'deleted_position'      => $this->deletedPosition,
            'replacement_status_id' => $replacementStatus->id,
            'replacement_position'  => $this->replacementPosition,
            'tasks_updated'         => $updatedCount,
        ]);
    }
}

