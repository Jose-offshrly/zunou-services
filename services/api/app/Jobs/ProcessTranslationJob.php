<?php

namespace App\Jobs;

use App\Events\AiResponseComplete;
use App\Models\DataSource;
use App\Models\Message;
use App\Models\Thread;
use App\Services\VectorDBService;
use GuzzleHttp\Client;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Log;

class ProcessTranslationJob implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    protected string $sourceDataSourceId;
    protected string $targetDataSourceId;
    protected string $targetLanguage;
    protected $userId;
    protected $threadId;

    public const TIMEOUT                 = 300; // Timeout in seconds (5 minutes)
    public const DEFAULT_SOURCE_LANGUAGE = 'en';

    public function __construct(
        string $sourceDataSourceId,
        string $targetDataSourceId,
        string $targetLanguage,
        string $userId,
        string $threadId,
    ) {
        $this->sourceDataSourceId = $sourceDataSourceId;
        $this->targetDataSourceId = $targetDataSourceId;
        $this->targetLanguage     = $targetLanguage;
        $this->userId             = $userId;
        $this->threadId           = $threadId;
    }

    public function handle(): void
    {
        try {
            Log::info('Starting translation job', [
                'source_id' => $this->sourceDataSourceId,
                'target_id' => $this->targetDataSourceId,
                'language'  => $this->targetLanguage,
                'user_id'   => $this->userId,
            ]);

            $source = $this->getDataSource($this->sourceDataSourceId);
            $target = $this->getDataSource($this->targetDataSourceId);

            $bucket = $this->getS3Bucket();

            $s3Urls = [
                'source' => $this->constructS3Url($bucket, $source->metadata),
                'target' => $this->constructS3Url($bucket, $target->metadata),
            ];

            $apiUrl = $this->getApiUrl();

            $this->processTranslationRequest(
                $apiUrl,
                $s3Urls,
                $this->targetLanguage,
            );

            $this->updateDataSourceStatus($target, 'INDEXED');

            // Add data to the vector database
            $this->addToVectorDB($target);
            // Add a message to notify the user
            $this->addCompletionMessage($target);
            Log::info(
                'Translation and vector DB update completed successfully',
                [
                    'target_id' => $this->targetDataSourceId,
                ],
            );
        } catch (\Exception $e) {
            Log::error('Error in ProcessTranslationJob', [
                'message'   => $e->getMessage(),
                'source_id' => $this->sourceDataSourceId,
                'target_id' => $this->targetDataSourceId,
            ]);

            $this->markDataSourceAsFailed();
        }
    }

    private function getDataSource(string $id): DataSource
    {
        return DataSource::findOrFail($id);
    }

    private function constructS3Url(string $bucket, $metadata): string
    {
        // Ensure $metadata is a JSON string before decoding
        if (is_array($metadata)) {
            $data = $metadata;
        } else {
            $data = json_decode($metadata, true);
            if (json_last_error() !== JSON_ERROR_NONE) {
                throw new \InvalidArgumentException(
                    'Invalid JSON metadata: ' . json_last_error_msg(),
                );
            }
        }

        $fileKey = $data['fileKey'] ?? null;

        if (! $fileKey) {
            throw new \InvalidArgumentException(
                'File key missing in metadata.',
            );
        }

        return "s3://{$bucket}/{$fileKey}";
    }

    private function getS3Bucket(): string
    {
        $bucket = Config::get('zunou.s3.bucket');
        if (! $bucket) {
            throw new \RuntimeException('S3 bucket configuration is missing.');
        }
        return $bucket;
    }

    private function getApiUrl(): string
    {
        return match (Config::get('app.env')) {
            'production'  => 'http://unstructured.zunou.ai/dub',
            'staging'     => 'http://unstructured.staging.zunou.ai/dub',
            'development' => 'http://localhost:80/dub',
            default       => 'http://unstructured.development.zunou.ai/dub',
        };
    }

    private function processTranslationRequest(
        string $apiUrl,
        array $s3Urls,
        string $targetLanguage,
    ): void {
        $client = new Client();

        // Step 1: Start the dubbing job and get job ID
        $response = $client->post($apiUrl, [
            'json' => [
                'source_s3_url'   => $s3Urls['source'],
                'target_s3_url'   => $s3Urls['target'],
                'source_language' => self::DEFAULT_SOURCE_LANGUAGE,
                'target_language' => $targetLanguage,
            ],
            'timeout' => self::TIMEOUT,
        ]);

        if ($response->getStatusCode() !== 202) {
            throw new \RuntimeException(
                'Failed to start dubbing process. API response: ' .
                    $response->getBody(),
            );
        }

        $jobId = json_decode((string) $response->getBody(), true)['job_id'];

        // Step 2: Poll the job status endpoint
        $statusUrl = "{$apiUrl}/status/{$jobId}";
        $startTime = time();

        do {
            sleep(5); // Wait for 5 seconds between polls
            $statusResponse = $client->get($statusUrl, ['timeout' => 10]);

            $statusData = json_decode(
                (string) $statusResponse->getBody(),
                true,
            );
            Log::info('Dubbing process status', [
                'job_id' => $jobId,
                'status' => $statusData['status'],
            ]);
            if ($statusData['status'] === 'completed') {
                Log::info('Dubbing process completed successfully.', [
                    'job_id' => $jobId,
                ]);
                return; // Exit function on success
            } elseif ($statusData['status'] === 'failed') {
                throw new \RuntimeException(
                    'Dubbing process failed: ' . $statusData['message'],
                );
            }

            // Timeout check
            if (time() - $startTime > self::TIMEOUT) {
                throw new \RuntimeException('Dubbing process timed out.');
            }
        } while ($statusData['status'] !== 'completed');
    }

    private function addCompletionMessage(DataSource $target): void
    {
        try {
            // Find the thread matching the thread_id
            $thread = Thread::where('id', $this->threadId)->first();

            if (! $thread) {
                throw new \Exception(
                    "No active thread found for pulse_id: {$target->pulse_id}",
                );
            }

            // Create a message content
            $messageContent = json_encode([
                'summary' => "Translation complete for '{$target->name}'",
                'content' => [
                    [
                        'data_source_id'   => $target->id,
                        'text'             => 'Translation complete',
                        'data_source_type' => 'mp4',
                    ],
                ],
            ]);

            // Create a system message
            $message = Message::create([
                'content'         => $messageContent,
                'organization_id' => $thread->organization_id,
                'role'            => 'assistant',
                'thread_id'       => $this->threadId,
                'user_id'         => $this->userId,
                'is_system'       => false,
                'status'          => 'COMPLETE',
            ]);
            AiResponseComplete::dispatch($message);
            Log::info('Completion message added successfully.', [
                'data_source_id' => $target->id,
                'thread_id'      => $this->threadId,
            ]);
        } catch (\Exception $e) {
            Log::error('Error adding completion message', [
                'message'        => $e->getMessage(),
                'data_source_id' => $target->id,
            ]);
        }
    }

    private function updateDataSourceStatus(
        DataSource $dataSource,
        string $status,
    ): void {
        Model::withoutEvents(function () use ($dataSource, $status) {
            $dataSource->status = $status;
            $dataSource->save();
        });
    }

    private function markDataSourceAsFailed(): void
    {
        $target = DataSource::find($this->targetDataSourceId);
        if ($target) {
            $this->updateDataSourceStatus($target, 'FAILED');
        }
    }

    private function addToVectorDB(DataSource $dataSource): void
    {
        try {
            $organizationId = $dataSource->organization_id; // Assuming this exists
            $pulseId        = $dataSource->pulse_id; // Assuming this exists

            $vectorDBService = new VectorDBService();

            $vectorDBService->addOrUpdateDataInVectorDB(
                itemId: $dataSource->id,
                data: $dataSource->description,
                orgId: $organizationId,
                dataSourceId: $dataSource->id,
                dataSourceName: $dataSource->name,
                dataSourceType: $dataSource->type,
                pulseId: $pulseId,
            );

            Log::info('Successfully added data to vector DB', [
                'data_source_id' => $dataSource->id,
            ]);
        } catch (\Exception $e) {
            Log::error('Error adding data to vector DB', [
                'message'        => $e->getMessage(),
                'data_source_id' => $dataSource->id,
            ]);
            throw $e;
        }
    }
}
