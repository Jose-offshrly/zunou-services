<?php

namespace App\Jobs;

use App\Enums\DataSourceStatus;
use App\Models\DataSource;
use Carbon\Carbon;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;

class CleanupFailedDataSourcesJob implements ShouldQueue
{
    use Queueable;

    /**
     * Execute the job.
     *
     * Deletes data sources where:
     * - metadata is null or empty
     * - OR status is FAILED
     * - AND created at least 30 minutes ago
     */
    public function handle(): void
    {
        try {
            // Get data sources that meet cleanup criteria (including soft-deleted ones)
            // Only consider data sources that are at least 30 minutes old
            $thirtyMinutesAgo = Carbon::now()->subMinutes(30);

            $dataSourcesToCleanup = DataSource::withTrashed()
                ->where(function ($query) {
                    $query
                        ->where(function ($subQuery) {
                            // Metadata is null or empty JSON object
                            $subQuery
                                ->whereNull('metadata')
                                ->orWhere('metadata', '{}')
                                ->orWhere('metadata', '[]');
                        })
                        ->orWhere('status', DataSourceStatus::Failed->value);
                })
                ->where('created_at', '<=', $thirtyMinutesAgo)
                ->get();

            // Count before deletion for logging
            $totalCount = $dataSourcesToCleanup->count();

            if ($totalCount === 0) {
                Log::info(
                    'CleanupFailedDataSourcesJob: No data sources found matching cleanup criteria',
                );

                return;
            }

            // Perform the permanent deletion (bypass soft deletes)
            $deletedCount = 0;
            foreach ($dataSourcesToCleanup as $dataSource) {
                $dataSource->forceDelete();
                $deletedCount++;
            }

            Log::info(
                "CleanupFailedDataSourcesJob: Successfully cleaned up {$deletedCount} data sources",
                [
                    'total_found'   => $totalCount,
                    'deleted_count' => $deletedCount,
                    'criteria'      => 'metadata is null/empty OR status is FAILED AND created at least 30 minutes ago',
                ],
            );
        } catch (\Exception $e) {
            Log::error(
                'CleanupFailedDataSourcesJob failed: ' . $e->getMessage(),
                [
                    'exception' => $e,
                    'trace'     => $e->getTraceAsString(),
                ],
            );

            throw new \Exception('Cleanup failed: ' . $e->getMessage());
        }
    }
}
