<?php

namespace App\Concerns;

use App\Models\MeetingSession;
use Aws\Sqs\SqsClient;
use Illuminate\Support\Facades\Log;

trait SimpleQueueServiceHandler
{
    protected function createSqsClient(): SqsClient
    {
        return new SqsClient([
            'version'     => 'latest',
            'region'      => config('zunou.aws.region'),
            'credentials' => [
                'key'    => config('zunou.aws.key'),
                'secret' => config('zunou.aws.secret'),
            ],
        ]);
    }

    private function fetchTranscriptFromSqs(
        MeetingSession $meetingSession,
    ): string {
        $maxAttempts = 15; // Prevent infinite loops
        $attempt     = 0;
        $success     = false;
        $messages    = null; // Local variable to store messages

        do {
            $sqsClient = $this->createSqsClient();

            $result = $sqsClient->receiveMessage([
                'QueueUrl' => config('zunou.aws.sqs_queue_url'),
            ]);

            Log::info(
                'Attempt ' . ($attempt + 1) . ' to retrieve messages from SQS',
            );

            if (! empty($result['Messages'])) {
                $messages = $result['Messages'];
                Log::info(
                    'Messages retrieved successfully after ' .
                        ($attempt + 1) .
                        ' attempts',
                );
                Log::info(
                    'Messages: ' . json_encode($messages, JSON_PRETTY_PRINT),
                ); // Log the messages
                $success = true;
                break;
            } else {
                Log::info(
                    'No messages available after attempt ' . ($attempt + 1),
                );
            }

            $attempt++;
            sleep(5); // Wait 5 seconds between attempts
        } while ($attempt < $maxAttempts);

        if (! $success) {
            Log::error("No messages after {$maxAttempts} attempts");

            return 'No transcription found!';
        }

        foreach ($messages as $message) {
            $messageBody = json_decode($message['Body'], true);
            Log::info('SqsClient Body:', $messageBody);

            // Check if meeting_id matches
            if (
                isset($messageBody['meeting_id']) && $messageBody['meeting_id'] === $meetingSession->meeting_id
            ) {
                $transcript = $messageBody['transcription'] ?? null;

                if ($transcript) {
                    // Optionally delete the message
                    // $sqsClient->deleteMessage([
                    //     'QueueUrl'      => config('zunou.aws.sqs_queue_url'),
                    //     'ReceiptHandle' => $message['ReceiptHandle'],
                    // ]);

                    return $transcript;
                }
            }
        }

        return 'No transcription found!';
    }
}
