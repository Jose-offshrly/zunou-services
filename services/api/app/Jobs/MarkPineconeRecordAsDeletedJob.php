<?php

namespace App\Jobs;

use App\Models\DataSource;
use GuzzleHttp\Client;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Log;

class MarkPineconeRecordAsDeletedJob implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    protected $dataSourceId;

    public function __construct($dataSourceId)
    {
        $this->dataSourceId = $dataSourceId;
    }

    public function handle()
    {
        Log::info(
            'MarkPineconeRecordAsDeletedJob: Starting job for DataSource ID: ' .
                $this->dataSourceId,
        );

        // Retrieve the data source (including soft-deleted ones if applicable)
        $dataSource = DataSource::withTrashed()->find($this->dataSourceId);
        if (! $dataSource) {
            Log::warning(
                'MarkPineconeRecordAsDeletedJob: DataSource not found with ID: ' .
                    $this->dataSourceId,
            );
            return;
        }

        $organizationId = $dataSource->organization->id;
        $pulseId        = $dataSource->pulse_id;
        $vectorIds      = $dataSource->vector_ids;

        // If vector_ids is empty then nothing to update.
        if (empty($vectorIds)) {
            Log::info(
                'MarkPineconeRecordAsDeletedJob: No vector IDs found for DataSource ID: ' .
                    $this->dataSourceId,
            );
            return;
        }

        // Ensure we have an array. If stored as a JSON string, decode it.
        if (is_string($vectorIds)) {
            $vectorIds = json_decode($vectorIds, true);
        }
        if (! is_array($vectorIds)) {
            Log::error(
                'MarkPineconeRecordAsDeletedJob: vector_ids is not an array for DataSource ID: ' .
                    $this->dataSourceId,
            );
            return;
        }

        // Set the Flask endpoint based on the app environment.
        $env    = Config::get('app.env');
        $apiUrl = match ($env) {
            'production'  => 'http://unstructured.zunou.ai/mark_deleted',
            'staging'     => 'http://unstructured.staging.zunou.ai/mark_deleted',
            'development' => 'http://localhost:8080/mark_deleted',
            default       => 'http://unstructured.development.zunou.ai/mark_deleted',
        };

        // Prepare the payload to mark these vectors as deleted in Pinecone.
        $body = [
            'pinecone_index_name' => $organizationId, // using the organization ID as the index name
            'pulse_id'            => $pulseId, // namespace in Pinecone
            'vector_ids'          => $vectorIds,
        ];

        try {
            $client   = new Client();
            $response = $client->post($apiUrl, [
                'json'    => $body,
                'timeout' => 300,
            ]);

            if ($response->getStatusCode() !== 200) {
                throw new \Exception(
                    'Failed to mark vectors as deleted. API response: ' .
                        $response->getBody(),
                );
            }

            $responseBody = json_decode((string) $response->getBody(), true);
            Log::info(
                'MarkPineconeRecordAsDeletedJob: Successfully marked vectors as deleted.',
                $responseBody,
            );
        } catch (\Exception $e) {
            Log::error(
                'MarkPineconeRecordAsDeletedJob: Exception occurred - ' .
                    $e->getMessage(),
            );
        }
    }
}
