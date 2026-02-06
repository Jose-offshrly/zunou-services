<?php

declare(strict_types=1);

namespace App\GraphQL\Mutations;

use App\Enums\TaskStatusSystemType;
use App\Models\TaskStatus;
use GraphQL\Error\Error;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

readonly class CreatePulseTaskStatusMutation
{
    public function __invoke($_, array $args): TaskStatus
    {
        try {
            $user = Auth::user();
            if (! $user) {
                throw new Error('No user found!');
            }

            return DB::transaction(function () use ($args) {
                // Calculate position: max position for this pulse + 1, or 1 if none exist
                $maxPosition = TaskStatus::where('pulse_id', $args['pulse_id'])
                    ->max('position') ?? 0;

                $position = $args['position'] ?? ($maxPosition + 1);

                // If position is specified, shift existing statuses up to make room
                if (isset($args['position'])) {
                    TaskStatus::where('pulse_id', $args['pulse_id'])
                        ->where('position', '>=', $position)
                        ->increment('position');
                }

                return TaskStatus::create([
                    'pulse_id' => $args['pulse_id'],
                    'label'    => $args['label'],
                    'color'    => $args['color'] ?? null,
                    'position' => $position,
                    'system_type' => TaskStatusSystemType::MIDDLE,
                ]);
            });
        } catch (\Exception $e) {
            throw new Error('Failed to create task status: ' . $e->getMessage());
        }
    }
}
