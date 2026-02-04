<?php

namespace Feature\Widget\Actions;

use App\Actions\Widget\UpdateWidgetOrderAction;
use App\Models\Widget;
use Tests\TestCase;

class UpdateWidgetOrderActionTest extends TestCase
{
    public function test_it_can_update_the_given_widgets()
    {
        $updates = [
            [
                'widgetId' => 'cb115c33-a1f9-430b-bb75-7fdb770e5c66',
                'order'    => 3,
            ],
            [
                'widgetId' => '08c4a3f0-a362-4252-9b1a-dfef072285c1',
                'order'    => 2,
            ],
            [
                'widgetId' => '1181c006-722c-4c1e-92d7-7d6bec459129',
                'order'    => 1,
            ],
        ];

        $action = app(UpdateWidgetOrderAction::class);

        $widgets = $action->handle($updates);

        $this->assertContainsOnlyInstancesOf(Widget::class, $widgets);
    }
}
