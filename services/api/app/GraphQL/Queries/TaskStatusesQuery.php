<?php

declare(strict_types=1);

namespace App\GraphQL\Queries;

use App\Models\TaskStatus;
use GraphQL\Error\Error;
use Illuminate\Support\Collection;

readonly class TaskStatusesQuery
{
    public function __invoke($rootValue, array $args): Collection
    {
        $pulseId  = $args['pulseId']  ?? null;
        $defaults = $args['defaults'] ?? false;

        // Validate mutual exclusivity
        if ($pulseId && $defaults) {
            throw new Error('Cannot provide both pulseId and defaults. They are mutually exclusive.');
        }

        $query = TaskStatus::query();

        if (isset($pulseId)) {
            $query->where('pulse_id', $pulseId);
        }

        if ($defaults) {
            $query->where('type', 'default');
        }

        // Order by position (null positions go to end)
        $query->orderByRaw('position IS NULL, position ASC');

        return $query->get();
    }
}
