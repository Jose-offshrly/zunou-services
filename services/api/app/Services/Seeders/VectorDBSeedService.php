<?php

namespace App\Services\Seeders;

use App\Models\DataSource;
use App\Models\Pulse;
use App\Services\LoadDataSourceService;
use App\Services\VectorDBService;
use Aws\S3\S3Client;
use Exception;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\App;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Probots\Pinecone\Client as Pinecone;

class VectorDBSeedService
{
    protected Pinecone $pinecone;

    protected int $retryInterval = 15; // in seconds

    protected int $maxRetries = 12; // total retries for index readiness

    protected array $chunkContents = []; // Store each chunk's content for summary

    public function __construct()
    {
        // Initialize Pinecone client with the API key
        $pineConeApiKey = config('zunou.pinecone.api_key');
        $this->pinecone = new Pinecone($pineConeApiKey);
    }

    private function initializeNamespace($namespace)
    {
        $zeroVector = array_fill(0, 1536, 0.1);
        $upsertResp = $this->pinecone
            ->data()
            ->vectors()
            ->upsert(
                [
                    [
                        'id'     => $namespace . '-000',
                        'values' => $zeroVector,
                    ],
                ],
                $namespace,
            );

        if (! $upsertResp->successful()) {
            throw new Exception(
                'Failed to upsert vector: ' . $upsertResp->body(),
            );
        }
    }

    /**
     * Seed vector data for a given organization and pulse.
     *
     * @param  int  $organizationId
     * @param  string  $pulseId
     */
    /**
     * Seed vector data for a given organization and pulse.
     */
    public function seedVectorData($organizationId, $pulseId)
    {
        try {
            $pulse = Pulse::findOrFail($pulseId);
            if ($pulse->type === 'generic' || $pulse->type === 'mcp') {
                Log::info(
                    "No need to seed vector data for Generic Pulse.  organization: $organizationId and pulse: $pulseId",
                );

                Log::info('Initializing Namespace');
                $start     = microtime(true);
                $indexName = $organizationId;
                if (! $this->initializeIndex($indexName)) {
                    throw new Exception('Failed to initialize Pinecone index.');
                }
                if (! $this->waitForIndexReady($indexName)) {
                    throw new Exception('Pinecone index is not ready.');
                }
                $this->initializeNamespace($pulseId);

                $end           = microtime(true);
                $executionTime = $end - $start;

                Log::debug("Execution Time: {$executionTime} seconds");

                // UPDATE PULSE STATUS to ACTIVE
                $pulse->status = 'ACTIVE';
                $pulse->save();

                // delete the created dummy
                $this->deleteCreatedDummy($organizationId, $pulseId);

                return true;
            }
            $environment = App::environment() ?: 'production';
            $dataPath    = base_path(
                "data-seeds/{$environment}/{$pulse->type}/seed_data.json",
            );

            // Load seed data and retrieve the specified filename
            $seedData = json_decode(file_get_contents($dataPath), true);

            // Create a new DataSource entry
            $dataSource = $this->createDataSource($organizationId, $pulse);

            // Get the specified filename, defaulting if not provided
            $specifiedFilename = $seedData[0]['filename'] ?? "{$dataSource->id}.txt";

            // Create and upload the file to S3, updating metadata with file path and filename
            $filePath = $this->createAndUploadFileToS3(
                $organizationId,
                $dataSource,
                'txt',
                $specifiedFilename,
            );

            // Set metadata with filename and file path before upserting chunks
            $dataSource->metadata = array_merge($dataSource->metadata ?? [], [
                'fileKey'  => $filePath,
                'filename' => $specifiedFilename,
            ]);
            $dataSource->save();

            // Initialize Pinecone index
            $indexName = $organizationId;
            if (! $this->initializeIndex($indexName)) {
                throw new Exception('Failed to initialize Pinecone index.');
            }
            if (! $this->waitForIndexReady($indexName)) {
                throw new Exception('Pinecone index is not ready.');
            }

            // Process each chunk in the seed data, starting from the second element
            foreach (array_slice($seedData, 1) as $idx => $data) {
                $this->upsertVectorChunk(
                    $dataSource,
                    $data['content'],
                    $data['metadata'] ?? [],
                    $idx,
                    $pulse->id,
                );

                // Store chunk content for file creation and summary
                $this->chunkContents[] = $data['content'];
            }

            // Generate and store summary in DataSource
            $this->generateAndStoreSummary($dataSource);

            // Update data source status
            $dataSource->status = 'INDEXED';
            $dataSource->save();

            // UPDATE PULSE STATUS to ACTIVE
            $pulse->status = 'ACTIVE';
            $pulse->save();

            Log::info(
                "Successfully seeded vector data for organization: $organizationId and pulse: $pulseId",
            );
        } catch (\Exception $e) {
            Log::error('Error in seedVectorData: ' . $e->getMessage());
            throw $e;
        }
    }

    private function deleteCreatedDummy($organizationId, $pulseId)
    {
        $maxTries   = 10;
        $retryCount = 0;

        $vectorId = $pulseId . '-000';

        // wait the record to become available before delete
        while ($retryCount < $maxTries) {
            $response = $this->pinecone
                ->data()
                ->vectors()
                ->query(namespace: $pulseId, id: $vectorId);

            if (! $response->successful()) {
                $retryCount++;
                sleep(rand(3, 5));
                Log::info($response->body());
                continue;
            }

            $matchedVectorResp = json_decode($response->body(), true);
            $matchedVectors    = $matchedVectorResp['matches'];

            if (! empty($matchedVectors)) {
                $db = new VectorDBService();
                $db->deleteById($organizationId, $pulseId, $vectorId);
                break;
            }

            $retryCount++;
            sleep(rand(3, 5));
        }
    }

    /**
     * Create a DataSource entry in the database.
     */
    private function createDataSource($organizationId, $pulse)
    {
        return Model::withoutEvents(function () use ($organizationId, $pulse) {
            return DataSource::create([
                'id'              => Str::uuid()->toString(),
                'organization_id' => $organizationId,
                'pulse_id'        => $pulse->id,
                'name'            => 'HR Policy Japan', // TODO: change this based on the seed data selected,
                'status'          => 'INDEXING',
                'origin'          => 'preset',
                'type'            => 'rtf',
            ]);
        });
    }

    /**
     * Initialize and configure Pinecone index with retries.
     */
    private function initializeIndex(&$indexName): bool
    {
        try {
            retry(
                5,
                function () use (&$indexName) {
                    $this->pinecone = LoadDataSourceService::setPineconeIndexHost(
                        $this->pinecone,
                        $indexName,
                    );
                    Log::info("Pinecone index '$indexName' set successfully.");
                },
                20000, // Retry delay in milliseconds
            );

            return true;
        } catch (Exception $e) {
            Log::error("Failed to set Pinecone index: {$e->getMessage()}");

            return false;
        }
    }

    /**
     * Wait for the Pinecone index to be ready.
     */
    private function waitForIndexReady($indexName): bool
    {
        $retryCount = 0;

        while ($retryCount < $this->maxRetries) {
            try {
                $indexInfo = $this->pinecone
                    ->control()
                    ->index($indexName)
                    ->describe();
                $status = $indexInfo->json()['status']['ready'] ?? null;

                Log::debug('Pinecone index status: ', ['status' => $status]);

                if ($status === true) {
                    Log::info("Pinecone index '$indexName' is ready.");

                    return true;
                }
            } catch (Exception $e) {
                Log::warning(
                    "Pinecone index '$indexName' not ready. Exception: {$e->getMessage()}",
                );
            }

            Log::info(
                "Pinecone index '$indexName' not ready. Retry in {$this->retryInterval} seconds...",
            );
            sleep($this->retryInterval);
            $retryCount++;
        }

        return false;
    }

    /**
     * Vectorize and upsert a text chunk into Pinecone.
     */
    private function upsertVectorChunk(
        $dataSource,
        $content,
        $metadata,
        $index,
        $namespace,
    ) {
        // Generate vector for the content
        $denseVector = $this->vectorizeChunk($content);

        // Merge metadata with essential information
        $metadata = array_merge($metadata, [
            'data_source_id'   => $dataSource->id,
            'data_source_name' => $dataSource->name,
            'data_source_type' => $dataSource->type,
            'org_id'           => $dataSource->organization_id,
            'chunk_index'      => $index,
            'text'             => $content,
        ]);

        if (isset($dataSource->metadata['filename'])) {
            $metadata['filename'] = $dataSource->metadata['filename'];
        } else {
            $metadata['filename'] = 'Unknown Filename';
        }

        if (isset($dataSource->metadata['file_path'])) {
            $metadata['file_path'] = $dataSource->metadata['file_path'];
        } else {
            $metadata['file_path'] = 'Unknown File Path';
        }

        // Upsert the vector to Pinecone using the pulse ID as the namespace
        $upsertResp = $this->pinecone
            ->data()
            ->vectors()
            ->upsert(
                [
                    [
                        'id'       => "{$dataSource->organization_id}-{$index}",
                        'values'   => $denseVector,
                        'metadata' => $metadata,
                    ],
                ],
                $namespace,
            );

        if (! $upsertResp->successful()) {
            throw new Exception(
                'Failed to upsert vector: ' . $upsertResp->body(),
            );
        }

        Log::info(
            "Successfully upserted chunk $index for organization: {$dataSource->organization_id}",
        );
    }

    /**
     * Vectorize a text chunk using the embedding model.
     */
    private function vectorizeChunk($chunk)
    {
        $embeddingModel = Config::get('zunou.openai.embedding_model');
        if (! $embeddingModel) {
            throw new Exception('Embedding model not set in configuration.');
        }

        // Generate embedding for the chunk
        $embeddingResp = LoadDataSourceService::getEmbedding(
            $chunk,
            $embeddingModel,
        );

        if (! isset($embeddingResp['data'][0]['embedding'])) {
            throw new Exception('Failed to get embedding for chunk.');
        }

        return $embeddingResp['data'][0]['embedding'];
    }

    /**
     * Generate and store a summary of the chunks using OpenAI.
     */
    private function generateAndStoreSummary($dataSource)
    {
        $combinedContent = implode("\n", $this->chunkContents);

        // Send the combined content to OpenAI for summarization
        $summary = LoadDataSourceService::getSummaryFromOpenAI(
            $combinedContent,
        );

        // Save the summary in the DataSource
        $dataSource->summary = $summary;
        $dataSource->save();
    }

    /**
     * Create a file from chunks and upload it to S3.
     */
    private function createAndUploadFileToS3(
        $organizationId,
        $dataSource,
        $fileType = 'txt',
        $specifiedFilename = null,
    ): string {
        // Combine all chunk content
        $content = implode("\n\n", $this->chunkContents);

        // Define the temporary file path and use specified filename if provided
        $tempDir = storage_path('app/tmp');
        if (isset($specifiedFilename)) {
            $fileName = $specifiedFilename;
        } else {
            $fileName = "{$dataSource->id}.{$fileType}";
        }
        $tempFilePath = "{$tempDir}/{$fileName}";

        // Ensure the directory exists
        if (! is_dir($tempDir)) {
            mkdir($tempDir, 0755, true); // Create the directory if it doesn't exist
        }

        // Write content to a temporary file
        file_put_contents($tempFilePath, $content);

        // Upload to S3
        $s3Client = new S3Client([
            'version'     => 'latest',
            'region'      => Config::get('zunou.aws.region'),
            'credentials' => [
                'key'    => Config::get('zunou.aws.key'),
                'secret' => Config::get('zunou.aws.secret'),
            ],
        ]);

        // Define S3 path
        $key = 'organizations/' .
            $this->uuidToFolderPath($organizationId) .
            '/data-sources/' .
            $this->uuidToFolderPath($dataSource->id) .
            '/' .
            $fileName;

        $s3Client->putObject([
            'Bucket'     => Config::get('zunou.s3.bucket'),
            'Key'        => $key,
            'SourceFile' => $tempFilePath,
            'ACL'        => 'private',
        ]);

        // Delete temporary file
        unlink($tempFilePath);

        // Return the S3 file path
        return $key;
    }

    /**
     * Adds a folder prefix to a UUID, to prevent huge lists in S3
     * Before: 23e3d4ef-0fdd-4760-8be2-51f4f82bd74f
     * After:  /23/e3/23e3d4ef-0fdd-4760-8be2-51f4f82bd74f
     */
    private function uuidToFolderPath(string $uuid): string
    {
        $chunks = str_split(substr($uuid, 0, 8), 2);

        return implode('/', $chunks) . '/' . substr($uuid, 9);
    }
}
