<?php

declare(strict_types=1);

namespace App\GraphQL\Mutations;

use App\Enums\TaskStatusSystemType;
use App\Models\TaskStatus;
use GraphQL\Error\Error;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

readonly class DeletePulseTaskStatusMutation
{
    public function __invoke($_, array $args): bool
    {
        try {
            $user = Auth::user();
            if (! $user) {
                throw new Error('No user found!');
            }

            $taskStatus = TaskStatus::find($args['id']);
            if (! $taskStatus) {
                throw new Error('Task status not found!');
            }

            // Prevent deletion of system task statuses (START/END)
            if (in_array($taskStatus->system_type, [TaskStatusSystemType::START, TaskStatusSystemType::END])) {
                throw new Error('Cannot delete system statuses (START/END).');
            }

            Log::info('Deleting task status', [
                'task_status_id' => $taskStatus->id,
                'pulse_id' => $taskStatus->pulse_id,
                'label' => $taskStatus->label,
                'position' => $taskStatus->position,
            ]);

            return DB::transaction(function () use ($taskStatus) {
                $pulseId = $taskStatus->pulse_id;
                $deletedPosition = $taskStatus->position;

                // Delete the status (observer will handle task reassignment)
                $deleted = $taskStatus->delete();

                // Shift down all statuses after the deleted one to close the gap
                if ($deletedPosition !== null) {
                    TaskStatus::where('pulse_id', $pulseId)
                        ->where('position', '>', $deletedPosition)
                        ->decrement('position');
                }

                return $deleted;
            });
        } catch (\Exception $e) {
            throw new Error('Failed to delete task status: ' . $e->getMessage());
        }
    }
}
