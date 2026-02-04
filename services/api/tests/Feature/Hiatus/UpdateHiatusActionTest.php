<?php

namespace Feature\Hiatus;

use App\Actions\Hiatus\UpdateHiatusAction;
use App\Models\Hiatus;
use Tests\TestCase;

class UpdateHiatusActionTest extends TestCase
{
    public function test_it_can_update_hiatus_resource()
    {
        $hiatus = Hiatus::first();

        $action = app(UpdateHiatusAction::class);

        $hiatus = $action->handle($hiatus);

        $this->assertInstanceOf(Hiatus::class, $hiatus);
        $this->assertNotNull($hiatus->end_at);
        $this->assertNotNull($hiatus->total);
    }
}
