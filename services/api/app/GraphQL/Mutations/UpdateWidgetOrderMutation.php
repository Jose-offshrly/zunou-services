<?php

namespace App\GraphQL\Mutations;

use App\Actions\Widget\UpdateWidgetOrderAction;
use GraphQL\Error\Error;
use Illuminate\Support\Collection;

class UpdateWidgetOrderMutation
{
    public function __construct(
        private readonly UpdateWidgetOrderAction $updateWidgetOrderAction,
    ) {
    }

    public function __invoke($_, array $args): Collection
    {
        try {
            return $this->updateWidgetOrderAction->handle($args['input']);
        } catch (\Exception $e) {
            throw new Error('Failed to create a widget: ' . $e->getMessage());
        }
    }
}
