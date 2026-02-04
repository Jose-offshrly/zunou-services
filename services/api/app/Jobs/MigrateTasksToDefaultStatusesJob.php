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

class MigrateTasksToDefaultStatusesJob implements ShouldQueue
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
            Log::warning('Pulse not found for migration to default statuses', [
                'pulse_id' => $this->pulseId,
            ]);
            return;
        }

        // Get all tasks for this pulse
        $tasks = Task::where('entity_id', $pulse->id)
            ->whereNotNull('task_status_id')
            ->get();

        Log::info(['TASKS TO UPDATE STATUS: ', $tasks->count()]);

        // Build a map of default status positions to default status IDs
        $defaultStatusMap = [];
        $defaultStatuses = TaskStatus::whereNull('pulse_id')
            ->where('type', 'default')
            ->orderBy('position')
            ->get();
        Log::info('DEFAULT STATUS: ', $defaultStatuses->toArray());

        foreach ($defaultStatuses as $defaultStatus) {
            $defaultStatusMap[$defaultStatus->position] = $defaultStatus->id;
        }
        Log::info('DEFAULT STATUS MAP: ', $defaultStatusMap);

        // Get fallback default status (position 2, then position 1)
        $fallbackStatusId =
            $defaultStatusMap[2] ?? ($defaultStatusMap[1] ?? null);

        // Get max position for custom statuses to identify "last" position
        $maxCustomPosition = TaskStatus::where('pulse_id', $pulse->id)
            ->whereNull('type')
            ->max('position');

        // Update each task's task_status_id and enum status
        $migratedCount = 0;
        foreach ($tasks as $task) {
            if (!$task->taskStatus) {
                continue;
            }

            $currentStatus = $task->taskStatus;
            Log::info('CURRENT STATUS:', $currentStatus->toArray());

            // Only migrate if the current status is a custom status (pulse_id matches, type is null)
            if (
                $currentStatus->pulse_id === $pulse->id &&
                $currentStatus->type === null
            ) {
                $position = $currentStatus->position;
                $isLastPosition = $position === $maxCustomPosition;

                // Map position to enum status
                $enumStatus = match (true) {
                    $position === 1 => TaskStatusEnum::TODO,
                    $isLastPosition => TaskStatusEnum::COMPLETED,
                    default => TaskStatusEnum::INPROGRESS,
                };

                // Find the default status with the matching enum-mapped position
                $targetPosition = match ($enumStatus) {
                    TaskStatusEnum::TODO => 1,
                    TaskStatusEnum::INPROGRESS => 2,
                    TaskStatusEnum::COMPLETED => 3,
                    default => 2,
                };

                $newStatusId =
                    $defaultStatusMap[$targetPosition] ?? $fallbackStatusId;

                if ($newStatusId) {
                    $task->update([
                        'task_status_id' => $newStatusId,
                        'status' => $enumStatus,
                    ]);

                    $migratedCount++;

                    Log::debug('Migrated task to default status', [
                        'task_id' => $task->id,
                        'pulse_id' => $pulse->id,
                        'old_status_id' => $currentStatus->id,
                        'new_status_id' => $newStatusId,
                        'old_position' => $position,
                        'new_enum_status' => $enumStatus->value,
                    ]);
                }
            }
        }

        Log::info('Completed migration of tasks to default statuses', [
            'pulse_id' => $pulse->id,
            'tasks_total' => $tasks->count(),
            'tasks_migrated' => $migratedCount,
        ]);
    }
}
