<?php

namespace Tests\Feature\Background\Actions;

use App\Actions\Background\UpdateBackgroundAction;
use App\DataTransferObjects\UpdateBackgroundData;
use App\Models\Background;
use Tests\TestCase;

class UpdateBackgroundActionTest extends TestCase
{
    public function test_it_can_update_a_background_resource(): void
    {
        $background = Background::first();
        $data       = new UpdateBackgroundData(active: true);

        $action = app(UpdateBackgroundAction::class);

        $background = $action->handle(background: $background, data: $data);

        $this->assertInstanceOf(Background::class, $background);
        $this->assertTrue($background->active);
    }
}
