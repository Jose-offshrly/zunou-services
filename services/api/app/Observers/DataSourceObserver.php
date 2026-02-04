<?php

namespace App\Observers;

use App\Events\DataSourceCreated;
use App\Events\DataSourceFailed;
use App\Events\DataSourceIndexed;
use App\Events\DataSourceStatusUpdated;
use App\Jobs\MarkPineconeRecordAsDeletedJob;
use App\Jobs\ProcessAutomationJob;
use App\Jobs\ProcessFileDataSourceJob;
use App\Models\Automation;
use App\Models\DataSource;
use Illuminate\Contracts\Events\ShouldHandleEventsAfterCommit;
use Illuminate\Support\Facades\Log;

class DataSourceObserver implements ShouldHandleEventsAfterCommit
{
    /**
     * Handle the DataSource "created" event.
     */
    public function created(DataSource $dataSource): void
    {
        // Only dispatch ProcessFileDataSourceJob for non-meeting data sources
        if ($dataSource->origin && $dataSource->origin->value !== 'meeting') {
            \Log::info(
                'DataSourceObserver: dispatching ProcessFileDataSourceJob for ' .
                    $dataSource->name,
            );
            ProcessFileDataSourceJob::dispatch($dataSource->id)->onQueue(
                'default',
            );
        } elseif (! $dataSource->origin) {
            \Log::info(
                'DataSourceObserver: dispatching ProcessFileDataSourceJob for ' .
                    $dataSource->name,
            );
            ProcessFileDataSourceJob::dispatch($dataSource->id)->onQueue(
                'default',
            );
        } else {
            \Log::info(
                'DataSourceObserver: skipping ProcessFileDataSourceJob for ' .
                    $dataSource->name .
                    ' due to origin type.',
            );
        }

        event(
            new DataSourceCreated(
                organiztion_id: $dataSource->organization_id,
                pulse_id: $dataSource->pulse_id,
            ),
        );
    }

    /**
     * Handle the DataSource "updated" event.
     */
    public function updated(DataSource $dataSource): void
    {
        Log::info('DataSourceObserver: updated event triggered!');
        event(new DataSourceStatusUpdated($dataSource));

        // Only trigger indexed event when status changes to INDEXED
        if ($dataSource->status === 'INDEXED') {
            event(new DataSourceIndexed($dataSource));
            if ($dataSource->origin->value === 'meeting') {
                $pulse = $dataSource->pulse;
                if ($pulse) {
                    $automations = $pulse
                        ->strategies()
                        ->where('type', 'automations')
                        ->get()
                        ->map(function ($strategy) {
                            return Automation::where(
                                'strategy_id',
                                $strategy->id,
                            )
                                ->where('on_queue', true)
                                ->get();
                        })
                        ->flatten()
                        ->filter();

                    // Dispatch a job for each automation
                    foreach ($automations as $automation) {
                        $automation->on_queue = false;
                        Log::info(
                            'DataSourceObserver: dispatching automation ' .
                                $automation->id,
                        );
                        $automation->save();
                        Log::info(
                            'DataSourceObserver: saved automation ' .
                                $automation->id,
                        );
                        ProcessAutomationJob::dispatch(
                            $automation->id,
                            false,
                            $dataSource->id,
                        )->onQueue('default');
                        Log::info(
                            'DataSourceObserver: dispatched automation ' .
                                $automation->id,
                        );
                    }
                }
            }
        } elseif ($dataSource->status === 'FAILED') {
            event(new DataSourceFailed($dataSource));
        }
    }

    /**
     * Handle the DataSource "deleted" event.
     */
    public function deleted(DataSource $dataSource): void
    {
        Log::info('DataSourceObserver: deleted event for ' . $dataSource->id);
        // Dispatch the job to mark the Pinecone vector record as deleted.
        MarkPineconeRecordAsDeletedJob::dispatch($dataSource->id)->onQueue(
            'default',
        );
    }
}
