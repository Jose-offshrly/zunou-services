<?php

declare(strict_types=1);

namespace App\GraphQL\Queries;

use App\Enums\PulseCategory;
use App\Models\Pulse;
use App\Models\Task;
use GraphQL\Error\Error;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;

readonly class TasksQuery
{
    public function __invoke($rootValue, array $args): Collection
    {
        $user = Auth::user();
        if (!$user) {
            throw new Error('No user was found');
        }

        $query = Task::forOrganization($args['organizationId'])
            ->with(['assignees.user', 'entity'])
            ->when(
                $args['entityId'] ?? null,
                fn($q) => $q->forEntity($args['entityId'])
            )
            ->when(
                $args['type'] ?? null,
                fn($q) => $q->where('type', $args['type'])
            )
            ->when(
                isset($args['parentId']),
                fn($q) => $q->where('parent_id', $args['parentId']),
                function ($q) use ($args) {
                    // Only filter by null parent_id if not filtering by status
                    if (!isset($args['status'])) {
                        $q->whereNull('parent_id');
                    }
                }
            )
            ->when(isset($args['userId']), function ($q) use ($args) {
                $userId = $args['userId'];
                $organizationId = $args['organizationId'];

                $q->where(function ($query) use ($userId, $organizationId) {
                    // Get personal pulse IDs where the user is a member
                    $personalPulseIds = Pulse::where(
                        'category',
                        PulseCategory::PERSONAL
                    )
                        ->where('organization_id', $organizationId)
                        ->whereHas('members', function ($memberQuery) use (
                            $userId
                        ) {
                            $memberQuery->where('user_id', $userId);
                        })
                        ->pluck('id');

                    $query->where(function ($q) use (
                        $personalPulseIds,
                        $userId
                    ) {
                        // Condition 1: All tasks from personal pulses (including unassigned)
                        if ($personalPulseIds->isNotEmpty()) {
                            $q->where('entity_id', $personalPulseIds);
                        }

                        // Condition 2: Tasks assigned to the user (from any pulse)
                        // If task is inside a parent task (list), return the parent instead
                        $assignedTasks = Task::whereHas('assignees', function (
                            $assigneeQuery
                        ) use ($userId) {
                            $assigneeQuery->where('user_id', $userId);
                        })->get();

                        $parentIds = $assignedTasks
                            ->whereNotNull('parent_id')
                            ->pluck('parent_id')
                            ->unique();

                        $standaloneTaskIds = $assignedTasks
                            ->whereNull('parent_id')
                            ->pluck('id');

                        if (
                            $parentIds->isNotEmpty() ||
                            $standaloneTaskIds->isNotEmpty()
                        ) {
                            $q->orWhere(function ($subQuery) use (
                                $parentIds,
                                $standaloneTaskIds
                            ) {
                                if ($parentIds->isNotEmpty()) {
                                    $subQuery->whereIn('id', $parentIds);
                                }
                                if ($standaloneTaskIds->isNotEmpty()) {
                                    $subQuery->orWhereIn(
                                        'id',
                                        $standaloneTaskIds
                                    );
                                }
                            });
                        }
                    });
                });
            })
            ->when(
                !isset($args['status']),
                fn($q) => $q->applyCompletionTimeFilter()
            )
            ->filterByStatus($args['status'] ?? null)
            ->filterByStatus(
                $args['excludeStatus'] ?? null,
                true,
                $args['excludeWithChildren'] ?? false
            )
            ->filterByTaskStatus($args['taskStatusId'] ?? null)
            ->filterByTaskStatus(
                $args['excludeTaskStatusId'] ?? null,
                true,
                $args['excludeWithChildren'] ?? false
            )
            ->filterByAssignee($args['assigneeId'] ?? null)
            ->filterByAssignee(
                $args['excludeAssigneeId'] ?? null,
                true,
                $args['excludeWithChildren'] ?? false
            )
            ->filterByPriority($args['priority'] ?? null)
            ->filterByPriority(
                $args['excludePriority'] ?? null,
                true,
                $args['excludeWithChildren'] ?? false
            )
            ->filterByDueDate($args['date'] ?? null)
            ->filterByDateRange($args['dateRange'] ?? null)
            ->filterByScheduled(
                $args['isScheduled'] ?? null,
                $args['excludeWithChildren'] ?? false
            )
            ->filterBySearch($args['search'] ?? null)
            ->orderByCustom($args['orderBy'] ?? 'order');

        $results = $query->get();

        // If filtering by status, load children without completion time filter
        if (isset($args['status'])) {
            $results->load([
                'childrenWithoutFilter.assignees.user',
                'childrenWithoutFilter.entity',
                'childrenWithoutFilter.children.assignees.user',
                'childrenWithoutFilter.children.entity',
            ]);
            // Map childrenWithoutFilter to children for consistent API
            $results->each(function ($task) {
                if ($task->relationLoaded('childrenWithoutFilter')) {
                    $task->setRelation(
                        'children',
                        $task->childrenWithoutFilter
                    );
                }
            });
        } else {
            $results->load([
                'children.assignees.user',
                'children.entity',
                'children.children.assignees.user',
                'children.children.entity',
            ]);
        }

        // Filter out children assigned to excludeAssigneeId (Issue #3)
        if (isset($args['excludeAssigneeId'])) {
            $excludeAssigneeId = $args['excludeAssigneeId'];
            $results->each(function ($task) use ($excludeAssigneeId) {
                if ($task->relationLoaded('children')) {
                    $filteredChildren = $task->children->filter(function (
                        $child
                    ) use ($excludeAssigneeId) {
                        // Keep child only if it's NOT assigned to the excluded assignee
                        return !$child->assignees->contains(
                            'user_id',
                            $excludeAssigneeId
                        );
                    });
                    $task->setRelation('children', $filteredChildren);
                }
            });
        }

        // Store userId on each task for field resolver to use
        if (isset($args['userId'])) {
            $userId = $args['userId'];
            $results->each(function ($task) use ($userId) {
                // Store userId as a custom attribute for the field resolver
                $task->setAttribute('_filter_user_id', $userId);
            });
        }

        return $results;
    }
}
