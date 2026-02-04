<?php

declare(strict_types=1);

namespace App\GraphQL\Mutations;

use App\Actions\Task\UpdateTaskStatusOrderAction;
use GraphQL\Error\Error;
use Illuminate\Support\Collection;

readonly class UpdateTaskStatusOrderMutation
{
    public function __construct(
        private readonly UpdateTaskStatusOrderAction $updateTaskStatusOrderAction,
    ) {
    }

    public function __invoke($_, array $args): Collection
    {
        try {
            return $this->updateTaskStatusOrderAction->handle($args['input']);
        } catch (\Exception $e) {
            throw new Error('Failed to update task status order: ' . $e->getMessage());
        }
    }
}
