<?php

declare(strict_types=1);

namespace App\Actions\Task;

use App\Models\Task;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

final class UpdateTaskOrderAction
{
    public function handle(array $tasks): Collection
    {
        $normalizedTasks = collect($tasks)->map(function ($task) {
            return [
                'taskId'   => $task['taskId'],
                'parentId' => $task['parentId'] ?? null,
                'order'    => $task['order']       ?? null,
            ];
        });

        return DB::transaction(function () use ($normalizedTasks) {
            $updatedIds = [];

            foreach ($normalizedTasks as $task) {
                $taskModel = Task::findOrFail($task['taskId']);

                // If order is not set, place it at the end of its new parent's children
                if ($task['order'] === null) {
                    $maxOrder = Task::where(
                        'parent_id',
                        $task['parentId'],
                    )->max('order');
                    $task['order'] = is_null($maxOrder) ? 1 : $maxOrder + 1;
                }

                $taskModel->update([
                    'parent_id' => $task['parentId'],
                    'order'     => $task['order'],
                ]);

                $updatedIds[] = $task['taskId'];
            }

            return Task::whereIn('id', $updatedIds)->get();
        });
    }
}
