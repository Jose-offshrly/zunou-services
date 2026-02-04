<?php

namespace Feature\FireFlies\Actions;

use App\Actions\FireFlies\FetchUserFireFliesTranscriptsAction;
use App\DataTransferObjects\FireFliesTranscriptData;
use App\DataTransferObjects\FireFliesUserData;
use Illuminate\Support\Collection;
use Tests\TestCase;

class FetchUserFireFliesTranscriptionActionTest extends TestCase
{
    /**
     * @throws \Exception
     */
    public function test_it_fetches_fire_flies_user_transcriptions()
    {
        $user = new FireFliesUserData(
            user_id: config('fireflies.test.ff_user_id'), //Note: ensure to pass an actual user id from fire flies
            name: config('fireflies.test.user_name'),
            email: config('fireflies.test.user_email'),
        );

        $action = app(FetchUserFireFliesTranscriptsAction::class);

        $transcriptions = $action->handle(
            api_key: config('fireflies.test.api_key'),
            fireFliesUser: $user,
        );

        $this->assertInstanceOf(Collection::class, $transcriptions);
        $this->assertContainsOnlyInstancesOf(
            FireFliesTranscriptData::class,
            $transcriptions,
        );
    }
}
