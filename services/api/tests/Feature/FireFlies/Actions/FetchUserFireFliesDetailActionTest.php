<?php

namespace Feature\FireFlies\Actions;

use App\Actions\FireFlies\FetchUserFireFliesDetailAction;
use App\DataTransferObjects\FireFliesUserData;
use App\Models\User;
use Tests\TestCase;

class FetchUserFireFliesDetailActionTest extends TestCase
{
    /**
     * @throws \Exception
     */
    public function test_it_fetches_fire_flies_user_details()
    {
        $user = User::query()
            ->whereEmail(config('fireflies.test.user_email'))
            ->first();

        $action = app(FetchUserFireFliesDetailAction::class);

        $ff_user = $action->handle(
            api_key: config('fireflies.test.api_key'),
            user: $user,
        );

        $this->assertInstanceOf(FireFliesUserData::class, $ff_user);
        $this->assertNotNull($ff_user->user_id);
        $this->assertNotNull($ff_user->name);
        $this->assertNotNull($ff_user->email);
        $this->assertEquals($ff_user->email, $user->email);
    }
}
