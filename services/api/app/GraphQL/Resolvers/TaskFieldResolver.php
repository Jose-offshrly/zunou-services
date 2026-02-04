<?php

declare(strict_types=1);

namespace App\GraphQL\Resolvers;

use App\Enums\PulseCategory;
use App\Models\Pulse;
use App\Models\Task;
use Nuwave\Lighthouse\Execution\ResolveInfo;

final class TaskFieldResolver
{
    /**
     * Resolve children field with userId filtering if available
     */
    public function children(
        Task $task,
        array $args,
        $context,
        ResolveInfo $resolveInfo
    ) {
        // Check if userId is stored on the task (set by TasksQuery)
        $userId = $task->getAttribute('_filter_user_id') ?? null;

        // Check if task belongs to a personal pulse
        $isPersonalPulse = false;
        if ($task->entity_type === Pulse::class && $task->entity_id) {
            // Load entity if not already loaded
            if (!$task->relationLoaded('entity')) {
                $task->load('entity');
            }
            $entity = $task->entity;
            if (
                $entity instanceof Pulse &&
                $entity->category === PulseCategory::PERSONAL
            ) {
                $isPersonalPulse = true;
            }
        }

        // If userId is set, filter children to only those assigned to the user
        // EXCEPT if the task belongs to a personal pulse (include all children)
        if ($userId && !$isPersonalPulse) {
            // If relation is already loaded, filter it
            if ($task->relationLoaded('children')) {
                $children = $task->children;
                if ($children->isNotEmpty()) {
                    $children->loadMissing('assignees');
                    return $children
                        ->filter(function ($child) use ($userId) {
                            return $child->assignees->contains(function (
                                $assignee
                            ) use ($userId) {
                                return $assignee->user_id === $userId;
                            });
                        })
                        ->values();
                }
                return $children;
            }

            // If relation not loaded, load it with filtering
            return $task
                ->children()
                ->whereHas('assignees', function ($query) use ($userId) {
                    $query->where('user_id', $userId);
                })
                ->get();
        }

        // Default: return all children (use relation if loaded, otherwise load it)
        if ($task->relationLoaded('children')) {
            return $task->children;
        }

        return $task->children;
    }

    /**
     * Resolve task_number field - generates a task number based on task order
     */
    public function taskNumber(
        Task $task,
        array $args,
        $context,
        ResolveInfo $resolveInfo
    ): string {
        // Get the count of tasks created before this one in the same entity
        // This gives us the task number (1-indexed)
        $taskNumber = Task::where('entity_id', $task->entity_id)
            ->where('entity_type', $task->entity_type)
            ->where('created_at', '<=', $task->created_at)
            ->where('id', '!=', $task->id)
            ->count() + 1;

        // Format as "BUJ-{number}" or similar format
        // You can customize this format based on your needs
        return "BUJ-{$taskNumber}";
    }
}
