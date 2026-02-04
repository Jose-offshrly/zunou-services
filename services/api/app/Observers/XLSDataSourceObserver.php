<?php

namespace App\Observers;

use App\Jobs\ProcessXLSDataSourceJob;
use App\Models\DataSource;
use Illuminate\Support\Facades\Log;

class XLSDataSourceObserver
{
    /**
     * Handle the DataSource "created" event.
     */
    public function created(DataSource $dataSource): void
    {
        Log::info(
            '[XLSDataSourceObserver] created event for ' . $dataSource->id,
        );

        // Dispatch job based on the data source type
        ProcessXLSDataSourceJob::dispatch($dataSource->id)->onQueue('default');
    }

    /**
     * Handle the DataSource "updated" event.
     */
    public function updated(DataSource $dataSource): void
    {
        Log::info(
            '[XLSDataSourceObserver] updated event for ' . $dataSource->id,
        );

        // If the status has changed to INDEXING, trigger the processing
        if ($dataSource->status === 'INDEXING') {
            ProcessXLSDataSourceJob::dispatch($dataSource->id)->onQueue(
                'default',
            );
        }
    }

    /**
     * Handle the DataSource "deleted" event.
     */
    public function deleted(DataSource $dataSource): void
    {
        Log::info(
            '[XLSDataSourceObserver] deleted event for ' . $dataSource->id,
        );
    }
}
