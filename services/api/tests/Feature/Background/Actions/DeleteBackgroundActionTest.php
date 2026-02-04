<?php

namespace Tests\Feature\Background\Actions;

use App\Actions\Background\DeleteBackgroundAction;
use App\Models\Background;
use Tests\TestCase;

class DeleteBackgroundActionTest extends TestCase
{
    public function test_it_can_delete_a_given_background_resource()
    {
        $background = Background::first();

        $action = app(DeleteBackgroundAction::class);

        $background = $action->handle(background: $background);

        $count = Background::all();

        $this->assertTrue($background);
        $this->assertCount(1, $count);
    }
}
