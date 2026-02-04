<?php

namespace App\Jobs;

use App\Services\VectorDBService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class UpdateVectorByPineconeIdJob implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    protected $pineconeId;
    protected $data;
    protected $orgId;
    protected $pulseId;

    /**
     * Create a new job instance.
     *
     * @param string $orgId
     * @param string $pineconeId
     * @param string $data
     * @param string $pulseId
     */
    public function __construct($orgId, $pineconeId, $data, $pulseId)
    {
        $this->orgId      = $orgId;
        $this->pineconeId = $pineconeId;
        $this->data       = $data;
        $this->pulseId    = $pulseId;
    }

    /**
     * Execute the job.
     *
     * @param VectorDBService $vectorDBService
     * @return void
     */
    public function handle(VectorDBService $vectorDBService)
    {
        Log::info('Retrieving vector with Pinecone ID: ' . $this->pineconeId);

        try {
            // Retrieve the existing vector data from Pinecone using the new service method
            $existingMetadata = $vectorDBService->retrieveMetaDataById(
                $this->pineconeId,
                $this->orgId,
                $this->pulseId,
            );
            //log metadata
            //Log::info('metadata: ' . json_encode($existingMetadata));

            if (! $existingMetadata) {
                throw new \Exception(
                    'No metadata found for vector ID: ' . $this->pineconeId,
                );
            }

            Log::info(
                'Existing metadata retrieved for Pinecone ID: ' .
                    $this->pineconeId,
            );

            // Extract the required metadata fields for updating
            $dataSourceId   = $existingMetadata['data_source_id']   ?? null;
            $dataSourceName = $existingMetadata['data_source_name'] ?? ' ';
            $dataSourceType = $existingMetadata['data_source_type'] ?? ' ';

            if (! $dataSourceId) {
                throw new \Exception(
                    'Data source information is missing in the metadata.',
                );
            }

            // Now call addOrUpdateDataInVectorDB to update the vector with new data
            $vectorDBService->addOrUpdateDataInVectorDB(
                $this->pineconeId, // Pinecone ID
                $this->data, // New data
                $this->orgId, // Organization ID
                $dataSourceId, // Data source ID from the existing metadata
                $dataSourceName, // Data source name from the existing metadata
                $dataSourceType,
                $this->pulseId, // Pulse ID
            );

            Log::info(
                'Vector successfully updated for Pinecone ID: ' .
                    $this->pineconeId,
            );
        } catch (\Exception $e) {
            Log::error(
                'Error updating vector for Pinecone ID ' .
                    $this->pineconeId .
                    ': ' .
                    $e->getMessage(),
            );
            throw $e;
        }
    }
}
