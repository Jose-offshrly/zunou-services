<?php

declare(strict_types=1);

namespace App\GraphQL\Mutations;

use App\Actions\Widget\UpdateWidgetAction;
use App\DataTransferObjects\WidgetData;
use App\Models\Widget;
use GraphQL\Error\Error;

final class UpdateWidgetMutation
{
    public function __construct(
        private readonly UpdateWidgetAction $updateWidgetAction,
    ) {
    }

    public function __invoke($_, array $args): Widget
    {
        try {
            $widget = Widget::find($args['widgetId']);

            if (! $widget) {
                throw new Error('Widget not found. please create one');
            }

            $data = new WidgetData(
                user_id: $widget->user_id,
                organization_id: $widget->organization_id,
                name: $args['name'],
                columns: (int) $args['columns'],
            );

            return $this->updateWidgetAction->handle(
                data: $data,
                widget: $widget,
            );
        } catch (\Exception $e) {
            throw new Error('Failed to update widget: ' . $e->getMessage());
        }
    }
}
