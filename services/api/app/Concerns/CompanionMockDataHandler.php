<?php

namespace App\Concerns;

use Illuminate\Support\Facades\Http;

trait CompanionMockDataHandler
{
    public function mockCompanionEndpoints(string $meeting_id): void
    {
        Http::fake([
            config('zunou.companion.start_meeting_url') => Http::response(
                [
                    'code' => 200,
                    'body' => [
                        'status'     => 'queued_sqs',
                        'meeting_id' => $meeting_id,
                    ],
                ],
                200,
            ),
        ]);

        Http::fake([
            config('zunou.companion.stop_meeting_url') => Http::response(
                [
                    'code' => 200,
                    'body' => [
                        'status'     => 'stopped_sqs',
                        'meeting_id' => $meeting_id,
                    ],
                ],
                200,
            ),
        ]);

        Http::fake([
            config('zunou.companion.pause_meeting_url') => Http::response(
                [
                    'code' => 200,
                    'body' => [
                        'status'     => 'paused_sqs',
                        'meeting_id' => $meeting_id,
                    ],
                ],
                200,
            ),
        ]);

        Http::fake([
            config('zunou.companion.resume_meeting_url') => Http::response(
                [
                    'code' => 200,
                    'body' => [
                        'status'     => 'resumed_sqs',
                        'meeting_id' => $meeting_id,
                    ],
                ],
                200,
            ),
        ]);
    }
}
