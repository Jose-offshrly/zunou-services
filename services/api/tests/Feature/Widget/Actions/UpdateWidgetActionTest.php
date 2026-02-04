<?php

namespace Feature\Widget\Actions;

use App\Actions\Widget\UpdateWidgetAction;
use App\DataTransferObjects\WidgetData;
use App\Models\Widget;
use Tests\TestCase;

class UpdateWidgetActionTest extends TestCase
{
    public function test_it_can_create_an_active_widget_resource()
    {
        $widget = Widget::factory()->create();

        $data = new WidgetData(
            user_id: $widget->user_id,
            organization_id: $widget->organization_id,
            name: 'new-name',
            columns: 2,
        );

        $action = app(UpdateWidgetAction::class);

        $widget = $action->handle($data, $widget);

        $this->assertInstanceOf(Widget::class, $widget);
        $this->assertEquals($data->name, $widget->name);
        $this->assertEquals($data->columns, $widget->columns);
    }
}
