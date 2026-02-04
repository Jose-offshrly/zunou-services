<?php

namespace Feature\ActiveWidget\Actions;

use App\Actions\Widget\DeleteWidgetAction;
use App\Models\Widget;
use Tests\TestCase;

class DeleteWidgetActionTest extends TestCase
{
    public function test_it_can_delete_a_given_widget()
    {
        $widget = Widget::first();

        $action = app(DeleteWidgetAction::class);

        $widget = $action->handle($widget);

        $this->assertTrue($widget);
    }
}
