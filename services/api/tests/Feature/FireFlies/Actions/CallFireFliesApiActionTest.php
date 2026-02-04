<?php

namespace Feature\FireFlies\Actions;

use App\Actions\FireFlies\CallFireFliesApiAction;
use App\Models\Meeting;
use GraphQL\Error\Error;
use Tests\TestCase;

class CallFireFliesApiActionTest extends TestCase
{
    public function test_it_can_call_the_fire_flies_api()
    {
        $meeting = Meeting::first();

        $action = app(CallFireFliesApiAction::class);

        $variables = [
            'transcriptId' => $meeting->meeting_id,
        ];

        $fireFlies = $action->handle(
            api_key: config('fireflies.test.api_key'),
            query: $this->query(),
            variables: $variables,
        );

        $this->assertIsArray($fireFlies);
        $this->assertNotNull($fireFlies['data']);
    }

    public function test_it_throws_an_error_on_invalid_api_key()
    {
        // Specify the expected exception class
        $this->expectException(Error::class);

        $meeting = Meeting::first();

        $action = app(CallFireFliesApiAction::class);

        $variables = [
            'transcriptId' => $meeting->meeting_id,
        ];

        $action->handle(
            api_key: 'invalid_api_key',
            query: $this->query(),
            variables: $variables,
        );
    }

    private function query(): string
    {
        return <<<'GRAPHQL'
query Transcript($transcriptId: String!) {
    transcript(id: $transcriptId) {
        id
        title
    }
}
GRAPHQL;
    }
}
