<?php

namespace Feature\PulseMember;

use App\Actions\PulseMember\DeletePulseMemberAction;
use App\Models\PulseMember;
use Tests\TestCase;

class DeletePulseMemberActionTest extends TestCase
{
    public function test_it_can_delete_a_given_pulse_member()
    {
        $pulseMember = PulseMember::first();

        $action = app(DeletePulseMemberAction::class);

        $pulseMember = $action->handle($pulseMember);

        $this->assertTrue($pulseMember);
    }
}
