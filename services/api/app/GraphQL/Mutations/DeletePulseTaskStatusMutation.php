<?php

declare(strict_types=1);

namespace App\GraphQL\Mutations;

use App\Models\TaskStatus;
use GraphQL\Error\Error;
use Illuminate\Support\Facades\Auth;
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

            // Prevent deletion of default task statuses
            if ($taskStatus->type === 'default') {
                throw new Error('Cannot delete default task statuses.');
            }

            Log::info('Deleting task status', [
                'task_status_id' => $taskStatus->id,
                'pulse_id' => $taskStatus->pulse_id,
                'label' => $taskStatus->label,
            ]);

            return $taskStatus->delete();
        } catch (\Exception $e) {
            throw new Error('Failed to delete task status: ' . $e->getMessage());
        }
    }
}
