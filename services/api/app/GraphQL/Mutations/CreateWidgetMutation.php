<?php

namespace App\GraphQL\Mutations;

use App\Actions\Widget\CreateWidgetAction;
use App\DataTransferObjects\WidgetData;
use App\Models\Widget;
use GraphQL\Error\Error;

class CreateWidgetMutation
{
    public function __construct(
        private readonly CreateWidgetAction $createWidgetAction,
    ) {
    }

    public function __invoke($_, array $args): Widget
    {
        try {
            $data = new WidgetData(
                user_id: $args['userId'],
                organization_id: $args['organizationId'],
                name: $args['name'],
            );

            $widget = $this->createWidgetAction->handle($data);

            return $widget->refresh();
        } catch (\Exception $e) {
            throw new Error('Failed to create a widget: ' . $e->getMessage());
        }
    }
}
