<?php

declare(strict_types=1);

namespace Tests\Unit;

use App\Models\MeetingSession;
use Tests\TestCase;

class SimpleQueueServiceHandlerTest extends TestCase
{
    public function test_fetch_transcript_from_sqs_returns_correct_transcript_from_payload()
    {
        $payload = [
            'Messages' => [
                [
                    'MessageId'     => '25114e03-3508-4487-8a83-21c07066868b',
                    'ReceiptHandle' => '...fake-receipt...',
                    'MD5OfBody'     => '...',
                    'Body'          => json_encode([
                        'meeting_id'    => '01jsnz803qmw34f8n7mjyazy5t',
                        'bucket'        => 'meet-bot-staging',
                        'key'           => 'meetings/1mo4v582bgeoblo184o65d9v8e/logs/meetbot_1742643050986_transcriptions.log',
                        'transcription' => "[2025-03-22T11:31:21.057Z] Unknown: Hello, Mr. Paul.\n[2025-03-22T11:31:32.068Z] Unknown: How are you? Good to see you. I'm so happy to see you. Right, let's put this to bed and get\n[2025-03-22T11:31:44.995Z] Unknown: these results onto the server and prove that you work. Hold on a second, I just do this well.\n",
                    ]),
                ],
            ],
        ];

        $mockClient = new FakeSqsClient($payload);

        // Stub MeetingSession (could be a mock, model factory, or real model depending on your setup)
        $meetingSession = MeetingSession::first();

        $instance = new class ($mockClient) {
            use \App\Concerns\SimpleQueueServiceHandler;

            private $mockClient;

            public function __construct($mockClient)
            {
                $this->mockClient = $mockClient;
            }

            protected function createSqsClient()
            {
                return $this->mockClient;
            }

            public function callFetchTranscriptFromSqs($meetingSession)
            {
                return $this->fetchTranscriptFromSqs($meetingSession);
            }
        };
        $transcript = $instance->callFetchTranscriptFromSqs($meetingSession);

        $this->assertStringContainsString('Hello, Mr. Paul.', $transcript);
        $this->assertStringContainsString(
            'these results onto the server',
            $transcript,
        );
        $this->assertStringContainsString('just do this well', $transcript);
    }
}
