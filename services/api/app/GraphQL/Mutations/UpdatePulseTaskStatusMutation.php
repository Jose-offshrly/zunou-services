<?php

declare(strict_types=1);

namespace App\GraphQL\Mutations;

use App\Models\TaskStatus;
use GraphQL\Error\Error;
use Illuminate\Support\Facades\Auth;

readonly class UpdatePulseTaskStatusMutation
{
    public function __invoke($_, array $args): TaskStatus
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

            $updateData = [];

            if (isset($args['label'])) {
                $updateData['label'] = $args['label'];
            }

            if (array_key_exists('color', $args)) {
                $updateData['color'] = $args['color'];
            }

            if (array_key_exists('position', $args)) {
                $updateData['position'] = $args['position'];
            }

            if (! empty($updateData)) {
                $taskStatus->update($updateData);
            }

            return $taskStatus->refresh();
        } catch (\Exception $e) {
            throw new Error('Failed to update task status: ' . $e->getMessage());
        }
    }
}
