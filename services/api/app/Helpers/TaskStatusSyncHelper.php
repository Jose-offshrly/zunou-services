<?php

namespace App\Helpers;

use App\Enums\TaskStatus as TaskStatusEnum;
use App\Models\Pulse;
use App\Models\Task;
use App\Models\TaskStatus;
use Illuminate\Support\Facades\Log;

class TaskStatusSyncHelper
{
    /**
     * Sync task_status_id to status enum based on custom status position
     * Used when custom status is updated and we need to reflect it in the enum
     */
    public static function syncCustomStatusToEnum(Task $task): void
    {
        if (!$task->task_status_id || !$task->taskStatus) {
            return;
        }

        $customStatus = $task->taskStatus;

        // Only sync if it's a custom or default status (not null)
        if (
            $customStatus->pulse_id === null &&
            $customStatus->type !== 'default'
        ) {
            return;
        }

        \Log::info('Custom status found for syncing to enum', [
            'task_id' => $task->id,
            'custom_status_id' => $customStatus->id,
            'pulse_id' => $customStatus->pulse_id,
            'type' => $customStatus->type,
            'position' => $customStatus->position,
        ]);
        $position = (int) $customStatus->position;

        // Determine if this is the last position and should be treated as COMPLETED
        $shouldBeCompleted = false;
        if ($customStatus->pulse_id) {
            // For custom statuses
            $maxPosition = (int) TaskStatus::where(
                'pulse_id',
                $customStatus->pulse_id
            )
                ->whereNull('type')
                ->max('position');
            // Only treat as COMPLETED if it's the last position AND position >= 3
            // This ensures: position 1 = not started, position 2+ (middle) = in progress, last position (if >= 3) = completed
            $shouldBeCompleted = $position === $maxPosition && $position >= 3;
        } elseif ($customStatus->type === 'default') {
            // For default statuses (always 3 positions: 1=not started, 2=in progress, 3=completed)
            $shouldBeCompleted = $position === 3;
        }

        \Log::info('position value: ' . $position);
        \Log::info(
            'shouldBeCompleted value: ' .
                ($shouldBeCompleted ? 'true' : 'false')
        );

        // Map position to enum
        $enumStatus = match (true) {
            $position === 1 => TaskStatusEnum::TODO,
            $shouldBeCompleted => TaskStatusEnum::COMPLETED,
            default
                => TaskStatusEnum::INPROGRESS, // Position 2 and any middle positions
        };

        if ($task->status !== $enumStatus) {
            $task->status = $enumStatus;
            $task->saveQuietly(); // Avoid triggering observers

            Log::debug('Synced custom status to enum', [
                'task_id' => $task->id,
                'custom_status_id' => $customStatus->id,
                'position' => $position,
                'enum_status' => $enumStatus->value,
            ]);
        }
    }

    /**
     * Sync status enum to task_status_id based on enum value and pulse mode
     * Used when enum status is updated and we need to reflect it in the custom status
     */
    public static function syncEnumToCustomStatus(
        Task $task,
        ?string $pulseId = null
    ): void {
        if (!$task->status) {
            return;
        }

        // Get pulse to determine if using custom statuses
        $pulse = $pulseId
            ? Pulse::find($pulseId)
            : Pulse::find($task->entity_id);

        if (!$pulse) {
            return;
        }

        // Only sync if pulse is using custom statuses
        if ($pulse->status_option?->value !== 'custom') {
            // If using default mode, sync to default statuses
            self::syncEnumToDefaultStatus($task);
            return;
        }

        // Map enum to position
        $targetPosition = match ($task->status) {
            TaskStatusEnum::TODO => 1,
            TaskStatusEnum::INPROGRESS => 2,
            TaskStatusEnum::COMPLETED => 'last',
            TaskStatusEnum::OVERDUE => 2, // Treat OVERDUE as IN_PROGRESS
            default => null,
        };

        if ($targetPosition === null) {
            return;
        }

        // Find the custom status at the target position
        $customStatusQuery = TaskStatus::where('pulse_id', $pulse->id)
            ->whereNull('type')
            ->orderBy('position');

        if ($targetPosition === 'last') {
            $customStatus = $customStatusQuery
                ->orderBy('position', 'desc')
                ->first();
        } else {
            $customStatus = $customStatusQuery
                ->where('position', $targetPosition)
                ->first();
        }

        // Fallback to position 2 or first available if not found
        if (!$customStatus) {
            $customStatus = TaskStatus::where('pulse_id', $pulse->id)
                ->whereNull('type')
                ->orderBy('position')
                ->skip(1)
                ->first();

            if (!$customStatus) {
                $customStatus = TaskStatus::where('pulse_id', $pulse->id)
                    ->whereNull('type')
                    ->orderBy('position')
                    ->first();
            }
        }

        if ($customStatus && $task->task_status_id !== $customStatus->id) {
            $task->task_status_id = $customStatus->id;
            $task->saveQuietly(); // Avoid triggering observers

            Log::debug('Synced enum to custom status', [
                'task_id' => $task->id,
                'enum_status' => $task->status->value,
                'custom_status_id' => $customStatus->id,
                'position' => $customStatus->position,
            ]);
        }
    }

    /**
     * Sync enum status to default task_status_id
     * Used when pulse is in default mode
     */
    private static function syncEnumToDefaultStatus(Task $task): void
    {
        if (!$task->status) {
            return;
        }

        // Map enum to default status position
        $targetPosition = match ($task->status) {
            TaskStatusEnum::TODO => 1,
            TaskStatusEnum::INPROGRESS => 2,
            TaskStatusEnum::COMPLETED => 3,
            TaskStatusEnum::OVERDUE => 2, // Treat OVERDUE as IN_PROGRESS
            default => null,
        };

        if ($targetPosition === null) {
            return;
        }

        // Find the default status at the target position
        $defaultStatus = TaskStatus::whereNull('pulse_id')
            ->where('type', 'default')
            ->where('position', $targetPosition)
            ->first();

        if ($defaultStatus && $task->task_status_id !== $defaultStatus->id) {
            $task->task_status_id = $defaultStatus->id;
            $task->saveQuietly(); // Avoid triggering observers

            Log::debug('Synced enum to default status', [
                'task_id' => $task->id,
                'enum_status' => $task->status->value,
                'default_status_id' => $defaultStatus->id,
                'position' => $defaultStatus->position,
            ]);
        }
    }

    /**
     * Get the appropriate custom status ID for a given enum status
     * Used during task creation to enforce consistency
     */
    public static function getCustomStatusIdForEnum(
        TaskStatusEnum $enumStatus,
        string $pulseId
    ): ?string {
        $pulse = Pulse::find($pulseId);

        if (!$pulse || $pulse->status_option?->value !== 'custom') {
            return self::getDefaultStatusIdForEnum($enumStatus);
        }

        // Map enum to position
        $targetPosition = match ($enumStatus) {
            TaskStatusEnum::TODO => 1,
            TaskStatusEnum::INPROGRESS => 2,
            TaskStatusEnum::COMPLETED => 'last',
            TaskStatusEnum::OVERDUE => 2,
        };

        // Find the custom status at the target position
        $customStatusQuery = TaskStatus::where('pulse_id', $pulseId)
            ->whereNull('type')
            ->orderBy('position');

        if ($targetPosition === 'last') {
            $customStatus = $customStatusQuery
                ->orderBy('position', 'desc')
                ->first();
        } else {
            $customStatus = $customStatusQuery
                ->where('position', $targetPosition)
                ->first();
        }

        return $customStatus?->id;
    }

    /**
     * Get the appropriate default status ID for a given enum status
     */
    public static function getDefaultStatusIdForEnum(
        TaskStatusEnum $enumStatus
    ): ?string {
        $targetPosition = match ($enumStatus) {
            TaskStatusEnum::TODO => 1,
            TaskStatusEnum::INPROGRESS => 2,
            TaskStatusEnum::COMPLETED => 3,
            TaskStatusEnum::OVERDUE => 2,
        };

        $defaultStatus = TaskStatus::whereNull('pulse_id')
            ->where('type', 'default')
            ->where('position', $targetPosition)
            ->first();

        return $defaultStatus?->id;
    }

    /**
     * Sync both status and task_status_id to COMPLETED
     * Used when marking a task as completed
     */
    public static function markTaskAsCompleted(Task $task): void
    {
        $task->status = TaskStatusEnum::COMPLETED;

        // Sync to custom status if applicable
        self::syncEnumToCustomStatus($task, $task->entity_id);

        $task->saveQuietly(); // Avoid triggering observers again

        Log::debug('Marked task as completed with synced status', [
            'task_id' => $task->id,
            'status' => $task->status->value,
            'task_status_id' => $task->task_status_id,
        ]);
    }
}
