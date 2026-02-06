<?php

declare(strict_types=1);

namespace App\Actions\Task;

use App\Enums\TaskStatusSystemType;
use App\Models\TaskStatus;
use GraphQL\Error\Error;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

final class UpdateTaskStatusOrderAction
{
    public function handle(array $statuses): Collection
    {
        $normalizedStatuses = collect($statuses)->map(function ($status) {
            return [
                'id'       => $status['id'],
                'position' => $status['position'],
            ];
        });

        return DB::transaction(function () use ($normalizedStatuses)  {
            // Load all statuses
            $statusIds = $normalizedStatuses->pluck('id');
            $statusModels = TaskStatus::whereIn('id', $statusIds)->get()->keyBy('id');

            // Update all positions
            foreach ($normalizedStatuses as $status) {
                $statusModel = $statusModels->get($status['id']);
                if ($statusModel) {
                    $statusModel->update([
                        'position' => $status['position'],
                    ]);
                }
            }

            return $statusModels->values();
        });
    }
}
