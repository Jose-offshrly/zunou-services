<?php

declare(strict_types=1);

namespace App\GraphQL\Mutations;

use App\Actions\Task\UpdateTaskOrderAction;
use GraphQL\Error\Error;
use Illuminate\Support\Collection;

readonly class UpdateTaskOrderMutation
{
    public function __construct(
        private readonly UpdateTaskOrderAction $updateTaskOrderAction,
    ) {
    }

    public function __invoke($_, array $args): Collection
    {
        try {
            return $this->updateTaskOrderAction->handle($args['input']);
        } catch (\Exception $e) {
            throw new Error('Failed to update order: ' . $e->getMessage());
        }
    }
}
