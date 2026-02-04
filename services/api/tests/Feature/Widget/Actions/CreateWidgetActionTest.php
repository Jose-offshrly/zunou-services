<?php

namespace Feature\ActiveWidget\Actions;

use App\Actions\Widget\CreateWidgetAction;
use App\DataTransferObjects\WidgetData;
use App\Models\Organization;
use App\Models\User;
use App\Models\Widget;
use Tests\TestCase;

class CreateWidgetActionTest extends TestCase
{
    public function test_it_can_create_an_active_widget_resource()
    {
        $user         = User::factory()->create();
        $organization = Organization::first();
        $data         = new WidgetData(
            user_id: $user->id,
            organization_id: $organization->id,
            name: 'time-logger',
        );

        $action = app(CreateWidgetAction::class);

        $widget = $action->handle($data);

        $this->assertInstanceOf(Widget::class, $widget);
        $this->assertInstanceOf(Organization::class, $widget->organization);
        $this->assertEquals($user->id, $widget->user_id);
        $this->assertEquals('time-logger', $widget->name);
    }
}
