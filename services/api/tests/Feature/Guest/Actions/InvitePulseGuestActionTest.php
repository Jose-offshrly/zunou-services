<?php

namespace Feature\Guest\Actions;

use App\Actions\Pulse\InvitePulseGuestAction;
use App\DataTransferObjects\GuestData;
use App\Models\User;
use Tests\TestCase;

class InvitePulseGuestActionTest extends TestCase
{
    public function test_it_can_invite_users_as_pulse_guests()
    {
        $data = new GuestData(
            email: 'guest@gmail.com',
            role: 'guest',
            organizationId: '9d83b6d2-debe-45f0-943d-275c5ff769cf',
            pulseId: '390e1705-e423-4e19-9a68-cb7c4aa50528',
        );

        $action = app(InvitePulseGuestAction::class);

        $user = $action->handle($data);

        $this->assertInstanceOf(User::class, $user);
        $this->assertCount(1, $user->organizationUsers);
        $this->assertCount(1, $user->pulseMemberships);
    }
}
