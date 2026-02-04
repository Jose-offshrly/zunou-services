<?php

namespace App\Observers;

use App\Jobs\ProcessVideoDataSourceJob;
use App\Models\DataSource;
use Illuminate\Support\Facades\Log;

class VideoDataSourceObserver
{
    /**
     * Handle the DataSource "created" event.
     */
    public function created(DataSource $dataSource): void
    {
        Log::info('VideoSourceObserver: created event for ' . $dataSource->id);

        // Dispatch job based on the data source type
        ProcessVideoDataSourceJob::dispatch($dataSource->id)->onQueue(
            'default',
        );
    }

    /**
     * Handle the DataSource "updated" event.
     */
    public function updated(DataSource $dataSource): void
    {
        Log::info('DataSourceObserver: updated event for ' . $dataSource->id);

        // If the status has changed to INDEXING, trigger the processing
        if ($dataSource->status === 'INDEXING') {
            ProcessVideoDataSourceJob::dispatch($dataSource->id)->onQueue(
                'default',
            );
        }
    }

    /**
     * Handle the DataSource "deleted" event.
     */
    public function deleted(DataSource $dataSource): void
    {
        Log::info('DataSourceObserver: deleted event for ' . $dataSource->id);
    }
}
