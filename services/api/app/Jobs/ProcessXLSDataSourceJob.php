<?php

namespace App\Jobs;

use App\Models\DataSource;
use App\Services\VectorDBService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class ProcessXLSDataSourceJob implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    protected $dataSourceId;

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
    public function handle(): void
    {
        Log::info(
            '[ProcessXLSDataSourceJob]: processing file with data source ID ' .
                $this->dataSourceId,
        );

        try {
            // Retrieve the data source
            $dataSource = DataSource::findOrFail($this->dataSourceId);

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
            $pulseId        = $dataSource->pulse_id; // Use Pulse ID as namespace

            if (! $fileKey) {
                throw new \Exception('File key missing in metadata.');
            }

            // Prepare data for the vector database
            $vectorDBService = new VectorDBService();

            // Upsert into the vector database
            $vectorDBService->addOrUpdateDataInVectorDB(
                $itemId         = $dataSource->id, // Unique identifier for the vector
                $data           = $dataSource->name . "\n\n" . $dataSource->description, // Content to store in the vector
                $orgId          = $organizationId, // Organization ID
                $dataSourceId   = $dataSource->id, // Data source ID
                $dataSourceName = $dataSource->name, // Data source name
                $dataSourceType = $dataSource->type, // Data source type
                $pulseId        = $pulseId, // Namespace (Pulse ID)
            );

            Log::info('[ProcessXLSDataSourceJob] File processed successfully.');

            // Update the data source status
            $dataSource->status = 'INDEXED';
            $dataSource->save();
        } catch (\Exception $e) {
            Log::error('[ProcessXLSDataSourceJob] Error ' . $e->getMessage());
            $dataSource = DataSource::find($this->dataSourceId);
            if ($dataSource) {
                $dataSource->status = 'FAILED';
                $dataSource->save();
            }
        }
    }
}
