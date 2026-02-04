<?php

namespace App\Actions\Widget;

use App\Models\Widget;

class DeleteWidgetAction
{
    public function handle(Widget $widget): bool
    {
        return $widget->delete();
    }
}
