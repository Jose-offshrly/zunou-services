<?php

namespace Feature\FireFlies\Actions;

use App\Actions\FireFlies\FetchUserFireFliesTranscriptsAction;
use App\Actions\FireFlies\StoreUserFireFliesTranscriptionAction;
use App\DataTransferObjects\FireFliesUserData;
use App\Exceptions\FireFliesApiException;
use App\Models\Integration;
use App\Models\Meeting;
use App\Models\User;
use Tests\TestCase;

class StoreUserFireFliesTranscriptionActionTest extends TestCase
{
    /**
     * @throws FireFliesApiException
     */
    public function test_it_stores_the_transcriptions_to_db()
    {
        $integration = Integration::first();
        $user        = User::query()
            ->whereEmail(config('fireflies.test.user_email'))
            ->first();

        $ff_user = new FireFliesUserData(
            user_id: config('fireflies.test.ff_user_id'), //Note: ensure to pass an actual user id from fire flies
            name: config('fireflies.test.user_name'),
            email: config('fireflies.test.user_email'),
        );

        $transcripts = app(FetchUserFireFliesTranscriptsAction::class);

        $action = app(StoreUserFireFliesTranscriptionAction::class);

        $action->handle(
            transcriptions: $transcripts->handle(
                api_key: $integration->api_key,
                fireFliesUser: $ff_user,
            ),
            user: $user,
            pulseId: $integration->pulse_id,
        );

        $this->assertDatabaseCount('meetings', Meeting::count());
    }
}
