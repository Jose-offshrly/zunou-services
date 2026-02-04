<?php

declare(strict_types=1);

namespace App\GraphQL\Mutations;

use App\Models\TaskPhase;
use GraphQL\Error\Error;
use Illuminate\Support\Facades\Auth;

readonly class CreateTaskPhaseMutation
{
    public function __invoke($_, array $args): TaskPhase
    {
        try {
            $user = Auth::user();
            if (! $user) {
                throw new Error('No user found!');
            }

            return TaskPhase::create([
                'pulse_id' => $args['pulse_id'],
                'label'    => $args['label'],
                'color'    => $args['color'] ?? null,
            ]);
        } catch (\Exception $e) {
            throw new Error('Failed to create task phase: ' . $e->getMessage());
        }
    }
}
