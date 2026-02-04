<?php

namespace App\Jobs;

use App\Models\DataSource;
use App\Services\VectorDBService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class AddDataToVectorDB implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    protected $data;
    protected $orgId;
    protected $pulseId;

    private const DATA_SOURCE_TYPE = 'manual';

    /**
     * Create a new job instance.
     *
     * @return void
     */
    public function __construct($data, $orgId, $pulseId)
    {
        $this->data    = $data;
        $this->orgId   = $orgId;
        $this->pulseId = $pulseId;
    }

    /**
     * Execute the job.
     *
     * @return void
     */
    public function handle(VectorDBService $vectorDBService)
    {
        Log::info('Adding data to vector DB for organization ' . $this->orgId);

        // Register metadata in the DataSource table
        $data_source_id   = $this->registerDataSource();
        $data_source_type = self::DATA_SOURCE_TYPE;
        // Generate embedding and add it to the vector DB
        $vectorDBService->addOrUpdateDataInVectorDB(
            $this->generatePineConeID($data_source_id),
            $this->data,
            $this->orgId,
            $data_source_id,
            $this->generateDataSourceName(),
            $data_source_type,
            $this->pulseId,
        );
    }

    /**
     * Function to generate a unique pinecone ID for the data source.
     */
    protected function generatePineConeID($data_source_id)
    {
        return $data_source_id . '-1'; //assume this will always be the first entry on this new data source
    }

    /**
     * Function to generate a unique name for the data source.
     */
    protected function generateDataSourceName()
    {
        return 'manual_entry_' . uniqid();
    }

    /**
     * Register the metadata in the DataSource table.
     */
    protected function registerDataSource()
    {
        Log::info('Registering vector DB metadata.');

        try {
            // Step 1: Create a new DataSource record using Eloquent
            $dataSource = DataSource::create([
                'description'     => 'Vector DB data source for getting started data',
                'name'            => $this->generateDataSourceName(),
                'type'            => self::DATA_SOURCE_TYPE,
                'status'          => 'INDEXED',
                'organization_id' => $this->orgId,
                'pulse_id'        => $this->pulseId,
            ]);

            // Save the DataSource to trigger the UUID generation
            $dataSource->save();
            Log::info('DataSource created: ' . $dataSource->id);

            return $dataSource->id;
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error saving vector DB metadata: ' . $e->getMessage());
            throw $e;
        }
    }
}
