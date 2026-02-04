<?php

namespace App\Actions\Widget;

use App\DataTransferObjects\WidgetData;
use App\Models\Widget;

class CreateWidgetAction
{
    public function handle(WidgetData $data): Widget
    {
        $widgetData = [
            'organization_id' => $data->organization_id,
            'user_id'         => $data->user_id,
            'name'            => $data->name,
        ];

        $existingWidget = Widget::where($widgetData)->first();

        if ($existingWidget) {
            // If the widget exists, use its current order
            $widget = $existingWidget;
        } else {
            // If the widget doesn't exist, create a new one with a new order
            $widget = Widget::create(
                array_merge($widgetData, [
                    'order' => Widget::max('order') + 1,
                ]),
            );
        }

        return $widget->refresh();
    }
}
