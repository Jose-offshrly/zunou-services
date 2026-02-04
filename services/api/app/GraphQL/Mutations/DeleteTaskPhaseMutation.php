<?php

declare(strict_types=1);

namespace App\GraphQL\Mutations;

use App\Models\TaskPhase;
use GraphQL\Error\Error;
use Illuminate\Support\Facades\Auth;

readonly class DeleteTaskPhaseMutation
{
    public function __invoke($_, array $args): bool
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

            return $taskPhase->delete();
        } catch (\Exception $e) {
            throw new Error('Failed to delete task phase: ' . $e->getMessage());
        }
    }
}
