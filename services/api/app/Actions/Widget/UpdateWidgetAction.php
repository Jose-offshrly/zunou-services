<?php

namespace App\Actions\Widget;

use App\DataTransferObjects\WidgetData;
use App\Models\Widget;

class UpdateWidgetAction
{
    public function handle(WidgetData $data, Widget $widget): Widget
    {
        $widget->update([
            'name'    => $data->name,
            'columns' => $data->columns,
        ]);

        return $widget->refresh();
    }
}
