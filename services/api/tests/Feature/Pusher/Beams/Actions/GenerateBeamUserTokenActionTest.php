<?php

declare(strict_types=1);

namespace Tests\Feature\Pusher\Beams\Actions;

use App\Actions\Pusher\Beams\GenerateBeamUserTokenAction;
use App\Models\User;
use Tests\TestCase;

class GenerateBeamUserTokenActionTest extends TestCase
{
    public function test_it_can_generate_beams_token_for_a_given_user(): void
    {
        $user = User::factory()->create();

        $action = app(GenerateBeamUserTokenAction::class);

        $user = $action->handle(user: $user);

        $this->assertNotNull($user->pusher_beams_auth_token);
    }
}
