<?php

declare(strict_types=1);

namespace Tests\Unit;

use App\Console\Commands\TranscriptQueueWorker;
use App\Models\MeetingSession;
use App\Models\User;
use Tests\TestCase;

class TranscriptQueueWorkerTest extends TestCase
{
    public function test_fetch_transcript_from_sqs_returns_correct_transcript_from_payload()
    {
        $transcriptText = "[2025-03-22T11:31:21.057Z] Unknown: Hello, Mr. Paul.\n[2025-03-22T11:31:32.068Z] Unknown: How are you? Good to see you. I'm so happy to see you. Right, let's put this to bed and get\n[2025-03-22T11:31:44.995Z] Unknown: these results onto the server and prove that you work. Hold on a second, I just do this well.\n";
        $payload        = [
            'Messages' => [
                [
                    'MessageId'     => '25114e03-3508-4487-8a83-21c07066868b',
                    'ReceiptHandle' => '...fake-receipt...',
                    'MD5OfBody'     => '...',
                    'Body'          => json_encode([
                        'meeting_id'    => '01jtxdk24a9ge3cfrqf1mhw87c',
                        'bucket'        => 'meet-bot-staging',
                        'key'           => 'meetings/1mo4v582bgeoblo184o65d9v8e/logs/meetbot_1742643050986_transcriptions.log',
                        'transcription' => $transcriptText,
                    ]),
                ],
            ],
        ];

        $user = User::first();

        $meetingSession = MeetingSession::first();

        $worker = $this->getMockBuilder(TranscriptQueueWorker::class)
            ->onlyMethods(['deleteSqsMessage'])
            ->getMock();

        $worker->setSqsClientAndQueueUrl(
            $this->createMock(\Aws\Sqs\SqsClient::class),
            'https://fake-queue-url',
        );

        $worker->expects($this->once())->method('deleteSqsMessage');

        $worker->processSqsMessages($payload);

        $meetingSession->refresh();
        $this->assertEquals('ENDED', $meetingSession->status->value);
    }
}
