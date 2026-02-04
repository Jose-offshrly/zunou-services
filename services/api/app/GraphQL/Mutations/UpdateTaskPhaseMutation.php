<?php

declare(strict_types=1);

namespace App\GraphQL\Mutations;

use App\Models\TaskPhase;
use GraphQL\Error\Error;
use Illuminate\Support\Facades\Auth;

readonly class UpdateTaskPhaseMutation
{
    public function __invoke($_, array $args): TaskPhase
    {
        try {
            $user = Auth::user();
            if (! $user) {
                throw new Error('No user found!');
            }

            $taskPhase = TaskPhase::find($args['id']);
            if (! $taskPhase) {
                throw new Error('Task phase not found!');
            }

            $updateData = [];

            if (isset($args['label'])) {
                $updateData['label'] = $args['label'];
            }

            if (array_key_exists('color', $args)) {
                $updateData['color'] = $args['color'];
            }

            if (! empty($updateData)) {
                $taskPhase->update($updateData);
            }

            return $taskPhase->refresh();
        } catch (\Exception $e) {
            throw new Error('Failed to update task phase: ' . $e->getMessage());
        }
    }
}
