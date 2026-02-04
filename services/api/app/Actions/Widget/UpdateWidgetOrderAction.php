<?php

namespace App\Actions\Widget;

use App\Models\Widget;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class UpdateWidgetOrderAction
{
    public function handle(array $widgets): Collection
    {
        // Convert to an associative array
        $updatesArray = collect($widgets)
            ->pluck('order', 'widgetId')
            ->toArray();

        return DB::transaction(function () use ($updatesArray) {
            foreach ($updatesArray as $key => $value) {
                Widget::where('id', $key)->update(['order' => $value]);
            }
            // Retrieve the updated widgets and store in an array
            return Widget::whereIn('id', array_keys($updatesArray))->get();
        });
    }
}
