<?php

namespace App\Jobs;

use App\Models\DataSource;
use App\Services\Agents\Handlers\DataSourceHandler;
use GuzzleHttp\Client;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Log;

class ProcessFileDataSourceJob implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    protected $dataSourceId;

    // Timeout constant for the API request (in seconds)
    public const TIMEOUT = 300; // 5 minutes

    /**
     * Create a new job instance.
     */
    public function __construct($dataSourceId)
    {
        $this->dataSourceId = $dataSourceId;
    }

    /**
     * Execute the job.
     */
    /**
     * Query documents
     * Check if deleted (not used)
     * If not deleted, use the highest score document
     */
    public function handle(): void
    {
        Log::info(
            'ProcessFileDataSourceJob: processing file with data source ID ' .
                $this->dataSourceId,
        );

        try {
            // Get the data source
            $dataSource = DataSource::findOrFail($this->dataSourceId);
            Log::info('ProcessFileDataSourceJob: Data source found.', [
                'data_source' => $dataSource,
            ]);

            // Check if metadata is already an array
            $metadata = is_array($dataSource->metadata)
                ? $dataSource->metadata
                : json_decode($dataSource->metadata, true);

            if (json_last_error() !== JSON_ERROR_NONE) {
                Log::error('Failed to decode JSON metadata', [
                    'error' => json_last_error_msg(),
                ]);
                return;
            }
            $fileKey        = $metadata['fileKey'] ?? null;
            $organizationId = $dataSource->organization->id; // Use organization ID as Pinecone index
            $pulseId        = $dataSource->pulse_id; // New field for pulse_id as namespace

            if (! $fileKey) {
                throw new \Exception('File key missing in metadata.');
            }

            // Get the correct S3 bucket from config based on the environment
            $bucket = Config::get('zunou.s3.bucket');
            Log::info('ProcessFileDataSourceJob: Using bucket ' . $bucket);

            // Construct the S3 URL using the bucket and file key
            $s3Url = "s3://$bucket/$fileKey";
            Log::info('ProcessFileDataSourceJob: S3 URL ' . $s3Url);

            // Select the correct API URL based on the environment
            $env    = Config::get('app.env');
            $apiUrl = match ($env) {
                'production'  => 'http://unstructured.zunou.ai/process',
                'staging'     => 'http://unstructured.staging.zunou.ai/process',
                'development' => 'http://localhost:8080/process',
                default       => 'http://unstructured.development.zunou.ai/process',
            };

            // Prepare the request body with the S3 URL, Pinecone index (organization ID), data source ID, and pulse ID
            $body = [
                's3_url'              => $s3Url,
                'pinecone_index_name' => $organizationId, // Pass the org ID as the index name
                'data_source_id'      => $this->dataSourceId,
                'data_source_type'    => $dataSource->type,
                'pulse_id'            => $pulseId, // New pulse_id field for namespace
            ];

            // Send the request
            $client   = new Client();
            $response = $client->post($apiUrl, [
                'json'    => $body,
                'timeout' => self::TIMEOUT, // Timeout set using the constant
            ]);

            // Handle response
            if ($response->getStatusCode() !== 200) {
                throw new \Exception(
                    'Failed to process file. API response: ' .
                        $response->getBody(),
                );
            }

            // Parse the API response to extract vector IDs
            $responseBody = json_decode((string) $response->getBody(), true);
            if (isset($responseBody['vector_ids'])) {
                // Assuming your DataSource model has a 'vector_ids' field (stored as a JSON string)
                $dataSource->vector_ids = json_encode(
                    $responseBody['vector_ids'],
                );
                if (count($responseBody['vector_ids']) > 0) {
                    Log::info(
                        'ProcessFileDataSourceJob: Trying to query the document',
                    );
                    $zeroVector        = array_fill(0, 1536, 0.0);
                    $dataSourceHandler = new DataSourceHandler(
                        $organizationId,
                        $pulseId,
                    );
                    $search_results = [];
                    $maxTries       = 10;
                    $retryCount     = 0;

                    while (
                        count($search_results) === 0 && $retryCount < $maxTries
                    ) {
                        $search_results = $dataSourceHandler->query(
                            $zeroVector,
                            100,
                            [
                                'data_source_id' => $this->dataSourceId,
                            ],
                        );

                        if (! empty($search_results)) {
                            break; // Exit loop if results are found
                        }

                        $retryCount++;
                        sleep(2);
                    }

                    if (empty($search_results)) {
                        Log::error(
                            "ProcessFileDataSourceJob: Failed after $maxTries attempts. Data source may not be ready.",
                        );
                    } else {
                        Log::info(
                            'ProcessFileDataSourceJob: Data Source is ready.',
                        );
                    }
                }
            }

            Log::info('ProcessFileDataSourceJob: File processed successfully.');

            // Update the data source status
            $dataSource->status = 'INDEXED';
            $dataSource->save();
        } catch (\Throwable $e) {
            Log::error('ProcessFileDataSourceJob: Error ' . $e->getMessage());
            $dataSource         = DataSource::findOrFail($this->dataSourceId);
            $dataSource->status = 'FAILED';
            $dataSource->save();
        }
    }
}
