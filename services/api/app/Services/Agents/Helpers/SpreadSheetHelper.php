<?php

namespace App\Services\Agents\Helpers;

use App\Events\FileHandlerProgress;
use Aws\S3\S3Client;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Log;
use OpenAI\Client;

class SpreadSheetHelper
{
    protected Client $openAI;

    public function __construct(private readonly string $pulseThread)
    {
        $this->openAI = \OpenAI::client(config('zunou.openai.api_key'));
    }

    public function lookupSpreadsheet(string $prompt, string $fileKey): ?array
    {
        try {
            // Step 1: Retrieve the file from S3
            $filePath = $this->downloadFileFromS3($fileKey);
            if (! $filePath) {
                Log::error('Failed to download file from S3.');
                return null;
            }

            // Step 2: Upload the file to OpenAI
            $fileResponse = $this->uploadFileToOpenAI($filePath);
            if (! $fileResponse) {
                Log::error('File upload to OpenAI failed.');
                return null;
            }

            // Step 3: Create or retrieve an assistant
            $assistant = $this->createOrRetrieveAssistant();
            if (! $assistant) {
                Log::error('Failed to create or retrieve assistant.');
                return null;
            }

            // Step 4: Create a thread
            $thread = $this->createThread($prompt, $fileResponse->id);
            if (! $thread) {
                Log::error('Failed to create thread.');
                return null;
            }

            // Step 5: Run the thread
            $runResponse = $this->runThread($thread->id, $assistant->id);
            if (! $runResponse) {
                Log::error('Failed to create run.');
                return null;
            }

            // Step 6: Poll for run completion and retrieve messages
            $result = $this->pollForRunResults($thread->id, $runResponse->id);
            $this->cleanupAssistant($assistant->id); // New Cleanup Function

            if ($result) {
                // Ensure we pass the content back as the result
                return [
                    'status'  => 'success',
                    'content' => $result,
                ];
            }

            return [
                'status' => 'failed',
                'error'  => 'Failed to retrieve results from thread.',
            ];
        } catch (\Exception $e) {
            Log::error('Error in lookupSpreadsheet: ' . $e->getMessage());
            return [
                'status'  => 'error',
                'message' => $e->getMessage(),
            ];
        }
    }

    private function cleanupAssistant(string $assistantId): void
    {
        try {
            $response = $this->openAI->assistants()->delete($assistantId);
            if ($response->deleted) {
                Log::info('Assistant deleted successfully.', [
                    'assistant_id' => $assistantId,
                ]);
            } else {
                Log::warning('Assistant deletion reported as unsuccessful.', [
                    'assistant_id' => $assistantId,
                ]);
            }
        } catch (\Exception $e) {
            Log::error('Failed to delete assistant: ' . $e->getMessage(), [
                'assistant_id' => $assistantId,
            ]);
        }
    }

    private function pollForRunResults(
        string $threadId,
        string $runId,
        int $pollInterval = 2,
        int $timeout = 300,
    ): ?array {
        $elapsedTime = 0;

        $this->broadcastStatus(status: 'started', threadId: $this->pulseThread);

        while ($elapsedTime < $timeout) {
            try {
                // Retrieve the run status
                $runStatus = $this->openAI
                    ->threads()
                    ->runs()
                    ->retrieve($threadId, $runId);

                // Broadcast current status
                $this->broadcastStatus(
                    status: $runStatus->status,
                    threadId: $this->pulseThread,
                    data: ['elapsed_time' => $elapsedTime],
                );

                Log::info('Polling run status.', [
                    'status' => $runStatus->status,
                ]);

                if ($runStatus->status === 'completed') {
                    Log::info('Run completed successfully.', [
                        'run' => $runStatus,
                    ]);

                    $messages = $this->fetchMessages($threadId);

                    // Broadcast current status
                    $this->broadcastStatus(
                        status: $runStatus->status,
                        threadId: $this->pulseThread,
                        data: ['messages' => $messages],
                    );

                    // List messages to get the results
                    return $messages;
                } elseif ($runStatus->status === 'failed') {
                    Log::error('Run failed.', ['run' => $runStatus]);

                    // Broadcast current status
                    $this->broadcastStatus(
                        status: $runStatus->status,
                        threadId: $this->pulseThread,
                    );

                    return null;
                } elseif ($runStatus->status === 'incomplete') {
                    Log::warning('Run incomplete.', [
                        'incompleteDetails' => $runStatus->incompleteDetails,
                    ]);

                    // Broadcast current status
                    $this->broadcastStatus(
                        status: $runStatus->status,
                        threadId: $this->pulseThread,
                        data: ['details' => $runStatus->incompleteDetails],
                    );

                    return [
                        'status'  => 'incomplete',
                        'details' => $runStatus->incompleteDetails,
                    ];
                }

                // Wait before polling again
                sleep($pollInterval);
                $elapsedTime += $pollInterval;
            } catch (\Exception $e) {
                // Broadcast current status
                $this->broadcastStatus(
                    status: 'error',
                    threadId: $this->pulseThread,
                    data: ['message' => $e->getMessage()],
                );

                Log::error(
                    'Error while polling run status: ' . $e->getMessage(),
                );
                return null;
            }
        }

        // Broadcast current status
        $this->broadcastStatus(status: 'timeout', threadId: $this->pulseThread);

        Log::error('Run polling timed out after ' . $timeout . ' seconds.');
        return null;
    }

    private function broadcastStatus(
        string $status,
        string $threadId,
        ?array $data = [],
    ): void {
        FileHandlerProgress::dispatch(
            $status,
            'spreadsheet', // e.g., 'spreadsheet', 'document', 'image', etc.,
            $threadId,
            $data,
        );
    }

    private function fetchMessages(string $threadId): ?array
    {
        try {
            $messagesResponse = $this->openAI
                ->threads()
                ->messages()
                ->list($threadId, [
                    'limit' => 10,
                ]);

            $messages = $messagesResponse->data ?? [];
            //Log::info('Messages retrieved successfully.', ['messages' => $messages]);

            // Collect all message content in a structured format
            $result = [];
            foreach ($messages as $message) {
                if ($message->role === 'assistant') {
                    foreach ($message->content as $content) {
                        if ($content->type === 'text') {
                            $result[] = $content->text->value;
                        }
                    }
                }
            }

            return $result;
        } catch (\Exception $e) {
            Log::error('Failed to retrieve messages: ' . $e->getMessage());
            return null;
        }
    }

    private function downloadFileFromS3(string $fileKey): ?string
    {
        try {
            $bucket   = Config::get('zunou.s3.bucket');
            $s3Client = new S3Client([
                'version'     => 'latest',
                'region'      => Config::get('zunou.aws.region'),
                'credentials' => [
                    'key'    => Config::get('zunou.aws.key'),
                    'secret' => Config::get('zunou.aws.secret'),
                ],
            ]);

            Log::info("Downloading file from S3: $fileKey");
            $fileBody = $s3Client->getObject([
                'Bucket' => $bucket,
                'Key'    => $fileKey,
            ])['Body'];

            $tempPath = sys_get_temp_dir() . '/' . basename($fileKey);
            file_put_contents($tempPath, $fileBody->__toString());

            return $tempPath;
        } catch (\Exception $e) {
            Log::error('Failed to download file from S3: ' . $e->getMessage());
            return null;
        }
    }

    private function uploadFileToOpenAI(string $filePath): ?object
    {
        try {
            return $this->openAI->files()->upload([
                'file'    => fopen($filePath, 'rb'),
                'purpose' => 'assistants',
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to upload file to OpenAI: ' . $e->getMessage());
            return null;
        }
    }

    private function createOrRetrieveAssistant(): ?object
    {
        try {
            return $this->openAI->assistants()->create([
                'instructions' => 'You are a spreadsheet analysis assistant. Use Python code to analyze and interpret spreadsheet data.',
                'name'         => 'Spreadsheet Analysis Assistant',
                'model'        => 'gpt-4o',
                'tools'        => [['type' => 'code_interpreter']],
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to create assistant: ' . $e->getMessage());
            return null;
        }
    }

    private function createThread(string $prompt, string $fileId): ?object
    {
        Log::info('Creating thread with prompt: ' . $prompt);
        Log::info('Creating thread with file ID: ' . $fileId);

        try {
            return $this->openAI->threads()->create([
                'messages' => [
                    [
                        'role'        => 'user',
                        'content'     => $prompt,
                        'attachments' => [
                            [
                                'file_id' => $fileId,
                                'tools'   => [['type' => 'code_interpreter']],
                            ],
                        ],
                    ],
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to create thread: ' . $e->getMessage());
            return null;
        }
    }

    private function runThread(string $threadId, string $assistantId): ?object
    {
        Log::info('Creating run for thread: ' . $threadId);
        Log::info('Using assistant: ' . $assistantId);
        try {
            return $this->openAI
                ->threads()
                ->runs()
                ->create($threadId, [
                    'assistant_id' => $assistantId,
                ]);
        } catch (\Exception $e) {
            Log::error('Failed to create run: ' . $e->getMessage());
            return null;
        }
    }
}
