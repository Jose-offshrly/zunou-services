<?php

namespace App\Models;

use App\Concerns\BelongsToOrganization;
use App\Contracts\Assignable;
use App\Enums\TaskPriority;
use App\Enums\TaskStatus as TaskStatusEnum;
use App\Enums\TaskType;
use App\Jobs\DeleteEmbeddingsJob;
use App\Jobs\UpsertEmbeddingsJob;
use App\Observers\TaskObserver;
use App\Services\Agents\Shared\TaskPipeline;
use Illuminate\Database\Eloquent\Attributes\ObservedBy;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

#[ObservedBy(TaskObserver::class)]
class Task extends BaseModel implements Assignable
{
    use \App\Concerns\Assignable;
    use BelongsToOrganization;
    use HasFactory;
    use SoftDeletes;

    protected $casts = [
        'due_date' => 'datetime',
        'start_date' => 'datetime',
        'status' => TaskStatusEnum::class,
        'priority' => TaskPriority::class,
        'type' => TaskType::class,
    ];

    protected static function boot()
    {
        parent::boot();

        static::created(function ($task) {
            try {
                Log::debug('Task Created! Syncing to Pinecone', [
                    'id' => $task->id,
                ]);

                $taskDocument = TaskPipeline::prepareTaskForEmbedding($task);
                UpsertEmbeddingsJob::dispatch(
                    $task->organization_id,
                    "tasks:{$task->entity_id}",
                    [$taskDocument]
                );
            } catch (\Exception $ex) {
                Log::error(
                    "Error syncing new task to Pinecone: {$ex->getMessage()}",
                    [
                        'task_id' => $task->id,
                        'error' => $ex->getMessage(),
                    ]
                );
            }
        });

        static::updated(function ($task) {
            // Check if relevant fields were changed, otherwise do not sync
            $excludedFields = ['order', 'created_at', 'updated_at'];

            if (
                collect($task->getDirty())
                    ->except($excludedFields)
                    ->isNotEmpty()
            ) {
                Log::debug('Task Updated! Synching to Pinecone', [
                    ...$task->getDirty(),
                    'id' => $task->id,
                ]);
                try {
                    $taskDocument = TaskPipeline::prepareTaskForEmbedding(
                        $task
                    );
                    UpsertEmbeddingsJob::dispatch(
                        $task->organization_id,
                        "tasks:{$task->entity_id}",
                        [$taskDocument]
                    );
                } catch (\Exception $ex) {
                    Log::error(
                        "Error syncing task to Pinecone: {$ex->getMessage()}",
                        [
                            'task_id' => $task->id,
                            'error' => $ex->getMessage(),
                        ]
                    );
                }
            }
        });

        static::deleting(function ($task) {
            Log::debug('Task Deleted! Removing from Pinecone', [
                'id' => $task->id,
            ]);
            $taskIds = [$task->id];

            if ($task->type->value === TaskType::LIST->value) {
                if ($task->children) {
                    $subTasks = $task->children()->get();
                    $subTaskIds = $subTasks->pluck('id');

                    $taskIds = array_merge($taskIds, $subTaskIds->toArray());
                }
            }

            try {
                DeleteEmbeddingsJob::dispatch(
                    $task->organization_id,
                    "tasks:{$task->entity_id}",
                    $taskIds
                );
            } catch (\Exception $ex) {
                Log::error(
                    "Error deleting task from Pinecone: {$ex->getMessage()}",
                    [
                        'task_id' => $task->id,
                        'error' => $ex->getMessage(),
                    ]
                );
            }
        });
    }

    public function source(): MorphTo
    {
        return $this->morphTo();
    }

    public function entity(): MorphTo
    {
        return $this->morphTo();
    }

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'author_id');
    }

    public function updatedBy()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    public function parent()
    {
        return $this->belongsTo(Task::class, 'parent_id');
    }

    public function children()
    {
        return $this->hasMany(Task::class, 'parent_id')
            ->applyCompletionTimeFilter()
            ->orderBy('order');
    }

    public function childrenWithoutFilter()
    {
        return $this->hasMany(Task::class, 'parent_id')->orderBy('order');
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function taskPhase(): BelongsTo
    {
        return $this->belongsTo(TaskPhase::class);
    }

    public function taskStatus(): BelongsTo
    {
        return $this->belongsTo(TaskStatus::class);
    }

    /**
     * Tasks this task depends on (prerequisites)
     */
    public function dependencies()
    {
        return $this->belongsToMany(
            Task::class,
            'task_dependencies',
            'task_id',
            'depends_on_task_id'
        )->withTimestamps();
    }

    /**
     * Tasks that depend on this task (blockers)
     */
    public function dependents()
    {
        return $this->belongsToMany(
            Task::class,
            'task_dependencies',
            'depends_on_task_id',
            'task_id'
        )->withTimestamps();
    }

    public function getCompletedChildrenCountAttribute(): int
    {
        return $this->hasMany(Task::class, 'parent_id')
            ->where('status', 'COMPLETED')
            ->count() ?? 0;
    }

    public function scopeForEntity(Builder $query, string $entityId): Builder
    {
        return $query->where('tasks.entity_id', $entityId);
    }

    /**
     * Apply the completion time filter: include non-completed tasks or completed tasks within 24 hours
     */
    public function scopeApplyCompletionTimeFilter($query)
    {
        // Pre-resolve enum-backed values and the cutoff timestamp so they are
        // passed into the query as bound parameters, not inlined into SQL.
        $completedStatus = TaskStatusEnum::COMPLETED->value;
        $listType = TaskType::LIST->value;
        $twentyFourHoursAgo = now()->subHours(24);

        return $query->where(function ($q) use (
            $completedStatus,
            $listType,
            $twentyFourHoursAgo
        ) {
            $q->where('status', '!=', $completedStatus)
                // Always include lists
                ->orWhere('type', $listType)
                ->orWhere(function ($subQ) use (
                    $completedStatus,
                    $twentyFourHoursAgo
                ) {
                    $subQ
                        ->where('status', $completedStatus)
                        ->where('updated_at', '>=', $twentyFourHoursAgo);
                });
        });
    }

    /**
     * Conditionally apply completion time filter based on parameter
     */
    public function scopeApplyCompletionTimeFilterIf($query, $condition = true)
    {
        return $condition ? $query->applyCompletionTimeFilter() : $query;
    }

    public function scopeFilterByStatus(
        $query,
        $status,
        $exclude = false,
        $excludeWithChildren = false
    ) {
        return $query->when($status, function ($q) use (
            $status,
            $exclude,
            $excludeWithChildren
        ) {
            if ($exclude) {
                if ($excludeWithChildren) {
                    // New behavior: Include parent if it doesn't match OR any child doesn't match
                    // Exclude parent only if it matches AND all children match
                    // Include NULL status when excluding
                    $q->where(function ($subQuery) use ($status) {
                        $subQuery
                            ->where(function ($q1) use ($status) {
                                // Parent doesn't match the excluded status (including NULL)
                                $q1->where(
                                    'status',
                                    '!=',
                                    $status
                                )->orWhereNull('status');
                            })
                            ->orWhereHas('children', function ($q2) use (
                                $status
                            ) {
                                // OR has at least one child that doesn't match
                                $q2->where(function ($q3) use ($status) {
                                    $q3->where(
                                        'status',
                                        '!=',
                                        $status
                                    )->orWhereNull('status');
                                });
                            });
                    });
                } else {
                    // Old behavior: Only filter at parent level for exclusion (backward compatible)
                    // Include NULL status when excluding
                    $q->where(function ($subQuery) use ($status) {
                        $subQuery
                            ->where('status', '!=', $status)
                            ->orWhereNull('status');
                    });
                }
            } else {
                // Include children check for positive filtering
                $q->where('status', $status)->orWhereHas('children', function (
                    $q2
                ) use ($status) {
                    $q2->where('status', $status);
                });
            }
        });
    }

    public function scopeFilterByTaskStatus(
        $query,
        $taskStatusId,
        $exclude = false,
        $excludeWithChildren = false
    ) {
        return $query->when($taskStatusId, function ($q) use (
            $taskStatusId,
            $exclude,
            $excludeWithChildren
        ) {
            if ($exclude) {
                if ($excludeWithChildren) {
                    $q->where(function ($subQuery) use ($taskStatusId) {
                        $subQuery
                            ->where(function ($q1) use ($taskStatusId) {
                                // Parent doesn't match the excluded status (including NULL)
                                $q1->where(
                                    'task_status_id',
                                    '!=',
                                    $taskStatusId
                                )->orWhereNull('task_status_id');
                            })
                            ->orWhereHas('children', function ($q2) use (
                                $taskStatusId
                            ) {
                                // OR has at least one child that doesn't match
                                $q2->where(function ($q3) use ($taskStatusId) {
                                    $q3->where(
                                        'task_status_id',
                                        '!=',
                                        $taskStatusId
                                    )->orWhereNull('task_status_id');
                                });
                            });
                    });
                } else {
                    // Old behavior: Only filter at parent level for exclusion (backward compatible)
                    // Include NULL task_status_id when excluding
                    $q->where(function ($subQuery) use ($taskStatusId) {
                        $subQuery
                            ->where('task_status_id', '!=', $taskStatusId)
                            ->orWhereNull('task_status_id');
                    });
                }
            } else {
                // Include children check for positive filtering
                $q->where('task_status_id', $taskStatusId)->orWhereHas('children', function (
                    $q2
                ) use ($taskStatusId) {
                    $q2->where('task_status_id', $taskStatusId);
                });
            }
        });
    }

    public function scopeFilterByAssignee(
        $query,
        $assigneeId,
        $exclude = false,
        $excludeWithChildren = false
    ) {
        return $query->when($assigneeId, function ($q) use (
            $assigneeId,
            $exclude,
            $excludeWithChildren
        ) {
            if ($exclude) {
                if ($excludeWithChildren) {
                    $q->where(function ($subQuery) use ($assigneeId) {
                        $subQuery
                            ->whereDoesntHave('assignees', function ($q1) use (
                                $assigneeId
                            ) {
                                // Parent is not assigned to the excluded user
                                $q1->where('user_id', $assigneeId);
                            })
                            ->orWhereHas('children', function ($q2) use (
                                $assigneeId
                            ) {
                                // OR has at least one child not assigned to the excluded user
                                $q2->whereDoesntHave('assignees', function (
                                    $q3
                                ) use ($assigneeId) {
                                    $q3->where('user_id', $assigneeId);
                                });
                            });
                    });
                } else {
                    // Old behavior: Only filter at parent level for exclusion (backward compatible)
                    $q->whereDoesntHave('assignees', function ($q) use (
                        $assigneeId
                    ) {
                        $q->where('user_id', $assigneeId);
                    });
                }
            } else {
                // Include children check for positive filtering
                $q->whereHas('assignees', function ($q) use ($assigneeId) {
                    $q->where('user_id', $assigneeId);
                })->orWhereHas('children.assignees', function ($q) use (
                    $assigneeId
                ) {
                    $q->where('user_id', $assigneeId);
                });
            }
        });
    }

    public function scopeFilterByPriority(
        $query,
        $priority,
        $exclude = false,
        $excludeWithChildren = false
    ) {
        return $query->when($priority, function ($q) use (
            $priority,
            $exclude,
            $excludeWithChildren
        ) {
            if ($exclude) {
                if ($excludeWithChildren) {
                    // New behavior: Include parent if it doesn't match OR any child doesn't match
                    // Exclude parent only if it matches AND all children match
                    // Include NULL priority when excluding
                    $q->where(function ($subQuery) use ($priority) {
                        $subQuery
                            ->where(function ($q1) use ($priority) {
                                // Parent doesn't match the excluded priority (including NULL)
                                $q1->where(
                                    'priority',
                                    '!=',
                                    $priority
                                )->orWhereNull('priority');
                            })
                            ->orWhereHas('children', function ($q2) use (
                                $priority
                            ) {
                                // OR has at least one child that doesn't match
                                $q2->where(function ($q3) use ($priority) {
                                    $q3->where(
                                        'priority',
                                        '!=',
                                        $priority
                                    )->orWhereNull('priority');
                                });
                            });
                    });
                } else {
                    // Old behavior: Only filter at parent level for exclusion (backward compatible)
                    // Include NULL priority when excluding
                    $q->where(function ($subQuery) use ($priority) {
                        $subQuery
                            ->where('priority', '!=', $priority)
                            ->orWhereNull('priority');
                    });
                }
            } else {
                // Include children check for positive filtering
                $q->where('priority', $priority)->orWhereHas(
                    'children',
                    function ($q2) use ($priority) {
                        $q2->where('priority', $priority);
                    }
                );
            }
        });
    }

    public function scopeFilterByDueDate($query, $date)
    {
        return $query->when($date, function ($q) use ($date) {
            $q->whereDate(
                'due_date',
                '=',
                \Carbon\Carbon::parse($date)->toDateString()
            )->orWhereHas('children', function ($q2) use ($date) {
                $q2->whereDate(
                    'due_date',
                    '=',
                    \Carbon\Carbon::parse($date)->toDateString()
                );
            });
        });
    }

    public function scopeFilterByDateRange($query, $dateRange)
    {
        return $query->when(
            $dateRange && isset($dateRange['from'], $dateRange['to']),
            function ($q) use ($dateRange) {
                $from = \Carbon\Carbon::parse($dateRange['from'])->startOfDay();
                $to = \Carbon\Carbon::parse($dateRange['to'])->endOfDay();

                $q->whereBetween('due_date', [$from, $to])->orWhereHas(
                    'children',
                    function ($q2) use ($from, $to) {
                        $q2->whereBetween('due_date', [$from, $to]);
                    }
                );
            }
        );
    }

    public function scopeFilterByScheduled(
        $query,
        $isScheduled,
        $excludeWithChildren = false
    ) {
        return $query->when($isScheduled !== null, function ($q) use (
            $isScheduled,
            $excludeWithChildren
        ) {
            if ($isScheduled) {
                // Filter for scheduled tasks (has start_date OR due_date)
                // Always include children check for positive filtering
                $q->where(function ($subQuery) {
                    $subQuery
                        ->whereNotNull('start_date')
                        ->orWhereNotNull('due_date');
                })->orWhereHas('children', function ($q2) {
                    $q2->whereNotNull('start_date')->orWhereNotNull('due_date');
                });
            } else {
                // Filter for unscheduled tasks (both start_date AND due_date are null)
                if ($excludeWithChildren) {
                    // New behavior: Parent has no dates AND doesn't have children with dates
                    $q->where(function ($subQuery) {
                        $subQuery
                            ->whereNull('start_date')
                            ->whereNull('due_date');
                    })->whereDoesntHave('children', function ($q2) {
                        $q2->whereNotNull('start_date')->orWhereNotNull(
                            'due_date'
                        );
                    });
                } else {
                    // Old behavior: Parent has no dates OR has children with no dates
                    $q->where(function ($subQuery) {
                        $subQuery
                            ->whereNull('start_date')
                            ->whereNull('due_date');
                    })->orWhereHas('children', function ($q2) {
                        $q2->whereNull('start_date')->whereNull('due_date');
                    });
                }
            }
        });
    }

    public function scopeFilterBySearch($query, $search)
    {
        return $query->when($search, function ($q) use ($search) {
            $lowerSearch = strtolower($search);
            $q->where(
                DB::raw('LOWER(title)'),
                'like',
                '%' . $lowerSearch . '%'
            )->orWhereHas('children', function ($q2) use ($lowerSearch) {
                $q2->where(
                    DB::raw('LOWER(title)'),
                    'like',
                    '%' . $lowerSearch . '%'
                );
            });
        });
    }

    public function scopeOrderByCustom($query, $orderBy)
    {
        return $query->when($orderBy, function ($q) use ($orderBy) {
            // Map TaskOrder enum values to column and direction
            $sortMap = [
                'TITLE_ASC' => ['column' => 'title', 'direction' => 'asc'],
                'TITLE_DESC' => ['column' => 'title', 'direction' => 'desc'],
                'PRIORITY_ASC' => [
                    'column' => 'priority',
                    'direction' => 'asc',
                ],
                'PRIORITY_DESC' => [
                    'column' => 'priority',
                    'direction' => 'desc',
                ],
                'STATUS_ASC' => ['column' => 'status', 'direction' => 'asc'],
                'STATUS_DESC' => ['column' => 'status', 'direction' => 'desc'],
                'DUE_DATE_ASC' => [
                    'column' => 'due_date',
                    'direction' => 'asc',
                ],
                'DUE_DATE_DESC' => [
                    'column' => 'due_date',
                    'direction' => 'desc',
                ],
                'CREATED_AT_ASC' => [
                    'column' => 'created_at',
                    'direction' => 'asc',
                ],
                'CREATED_AT_DESC' => [
                    'column' => 'created_at',
                    'direction' => 'desc',
                ],
                'UPDATED_AT_ASC' => [
                    'column' => 'updated_at',
                    'direction' => 'asc',
                ],
                'UPDATED_AT_DESC' => [
                    'column' => 'updated_at',
                    'direction' => 'desc',
                ],
                'ASSIGNEE_ASC' => [
                    'column' => 'assignee',
                    'direction' => 'asc',
                ],
                'ASSIGNEE_DESC' => [
                    'column' => 'assignee',
                    'direction' => 'desc',
                ],
            ];

            // Check if it's a mapped enum value
            if (isset($sortMap[$orderBy])) {
                $sortConfig = $sortMap[$orderBy];

                // Special handling for assignee sorting (requires join)
                if ($sortConfig['column'] === 'assignee') {
                    return $q
                        ->leftJoin('assignees as assignees_sort', function (
                            $join
                        ) {
                            $join
                                ->on(
                                    'tasks.id',
                                    '=',
                                    'assignees_sort.entity_id'
                                )
                                ->where(
                                    'assignees_sort.entity_type',
                                    '=',
                                    Task::class
                                )
                                // Get only the first/primary assignee for sorting (using created_at as tiebreaker)
                                ->whereRaw(
                                    'assignees_sort.id = (
                                SELECT id FROM assignees 
                                WHERE entity_id = tasks.id 
                                AND entity_type = ? 
                                ORDER BY created_at ASC, id::text ASC 
                                LIMIT 1)',
                                    [Task::class]
                                );
                        })
                        ->leftJoin(
                            'users as users_sort',
                            'assignees_sort.user_id',
                            '=',
                            'users_sort.id'
                        )
                        ->orderBy('users_sort.name', $sortConfig['direction'])
                        ->select('tasks.*'); // Ensure we only select task columns
                }

                return $q->orderBy(
                    $sortConfig['column'],
                    $sortConfig['direction']
                );
            }

            // Fallback: treat as direct column name (for 'order'/'position' default)
            return $q->orderBy(strtolower($orderBy));
        });
    }

    public function getDueDateAttribute(): ?string
    {
        if (isset($this->attributes['due_date'])) {
            return Carbon::parse($this->attributes['due_date'])->userTimezone();
        }

        return null;
    }

    public function getCreatedAtAttribute(): ?string
    {
        if (isset($this->attributes['created_at'])) {
            return Carbon::parse(
                $this->attributes['created_at']
            )->userTimezone();
        }

        return null;
    }
}
