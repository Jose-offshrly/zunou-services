<?php

namespace App\GraphQL\Mutations;

use App\Actions\Widget\DeleteWidgetAction;
use App\Models\Widget;
use GraphQL\Error\Error;

class DeleteWidgetMutation
{
    public function __construct(
        private readonly DeleteWidgetAction $deleteWidgetAction,
    ) {
    }

    public function __invoke($_, array $args): bool
    {
        try {
            $widget = Widget::find($args['widgetId']);
            if (! $widget) {
                throw new \Error('Widget not found!');
            }

            return $this->deleteWidgetAction->handle($widget);
        } catch (\Exception $e) {
            throw new Error('Failed to delete widget: ' . $e->getMessage());
        }
    }
}
