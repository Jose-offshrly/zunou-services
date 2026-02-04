<?php

declare(strict_types=1);

namespace App\Actions\Task;

use App\Jobs\ResyncTaskStatusesOnReorderJob;
use App\Models\TaskStatus;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

final class UpdateTaskStatusOrderAction
{
    public function handle(array $statuses): Collection
    {
        $normalizedStatuses = collect($statuses)
            ->values()
            ->map(function ($status) {
                return [
                    'id' => $status['id'],
                    'position' => $status['position'] + 1,
                ];
            });

        $updated = DB::transaction(function () use ($normalizedStatuses) {
            $updatedIds = [];

            foreach ($normalizedStatuses as $status) {
                $statusModel = TaskStatus::findOrFail($status['id']);

                $statusModel->update([
                    'position' => $status['position'],
                ]);

                $updatedIds[] = $status['id'];
            }

            return TaskStatus::whereIn('id', $updatedIds)->get();
        });

        // Dispatch re-sync jobs for affected pulses (only for custom statuses)
        $pulseIds = $updated
            ->whereNotNull('pulse_id')
            ->filter(fn($s) => $s->type === null)
            ->pluck('pulse_id')
            ->unique()
            ->values()
            ->all();

        if (!empty($pulseIds)) {
            Log::info('Dispatching ResyncTaskStatusesOnReorderJob for pulses', [
                'pulse_ids' => $pulseIds,
            ]);

            foreach ($pulseIds as $pulseId) {
                ResyncTaskStatusesOnReorderJob::dispatch($pulseId);
            }
        }

        return $updated;
    }
}
