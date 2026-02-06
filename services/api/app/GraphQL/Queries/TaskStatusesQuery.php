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
        $pulseId = $args['pulseId'] ?? null;

        if (!$pulseId) {
            throw new Error('pulseId is required.');
        }

        $query = TaskStatus::query()
            ->where('pulse_id', $pulseId)
            ->orderByRaw("
                CASE system_type
                    WHEN 'start' THEN 1
                    WHEN 'middle' THEN 2
                    WHEN 'end' THEN 3
                END, position ASC NULLS LAST
            ");

        return $query->get();
    }
}
