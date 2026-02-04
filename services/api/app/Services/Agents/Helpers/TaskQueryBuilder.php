<?php

namespace App\Services\Agents\Helpers;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;
use InvalidArgumentException;

class TaskQueryBuilder
{
    // Allowed Models and their classes
    protected static $allowedModels = [
        'Task'     => \App\Models\Task::class,
        'User'     => \App\Models\User::class,
        'Assignee' => \App\Models\Assignee::class,
    ];

    // Allowed columns for each model
    protected static $allowedColumns = [
        'Task' => [
            'id',
            'parent_id',
            'title',
            'description',
            'status',
            'priority',
            'due_date',
            'created_at',
            'updated_at',
            'type',
            'entity_type',
            'entity_id',
        ],
        'User'     => ['id', 'name', 'email'],
        'Assignee' => ['id', 'user_id', 'entity_type', 'entity_id'],
    ];

    // Allowed relations for each model
    protected static $allowedRelations = [
        'Task'     => ['assignees', 'assignees.user', 'parent', 'subtasks'],
        'User'     => [],
        'Assignee' => ['user'],
    ];

    protected static $allowedOperators = [
        '=',
        '<',
        '>',
        '>=',
        '<=',
        'ILIKE',
        'IN',
        '!=',
    ];

    protected static $allowedAggregates = ['count', 'max', 'min', 'avg', 'sum'];

    protected static $maxLimit     = 100;
    protected static $defaultLimit = 50;

    /**
     * Returns
     *   - Collection of Models (normal query)
     *   - [alias => scalar] (for top-level aggregate intent)
     */
    public static function fromIntent(array $intent, string $pulseId)
    {
        $modelKey = $intent['model'] ?? null;
        if (! isset(static::$allowedModels[$modelKey])) {
            static::throw("Model '{$modelKey}' is not allowed.", [
                'allowed_models' => array_keys(static::$allowedModels),
            ]);
        }

        $modelClass = static::$allowedModels[$modelKey];
        /** @var Builder $query */
        $query = $modelClass::query();

        // --- Column Selection ---
        $columns = $intent['columns'] ?? [];
        if ($columns) {
            $validColumns = array_values(
                array_intersect($columns, static::$allowedColumns[$modelKey]),
            );
            if (empty($validColumns)) {
                static::throw('No valid columns selected.', [
                    'requested' => $columns,
                    'allowed'   => static::$allowedColumns[$modelKey],
                ]);
            }
            // Always include primary key for correct relation loading
            if (! in_array('id', $validColumns, true)) {
                $validColumns[] = 'id';
            }
            $query->select($validColumns);
        } else {
            $query->select(static::$allowedColumns[$modelKey]);
        }

        // --- Joins (load relations / aggregates) ---
        if (! empty($intent['joins'])) {
            $with = static::buildWithArray($intent['joins'], $modelKey);
            $query->with($with);
        }

        // --- System level Filters ---
        $intent['filters'] = static::preprocessOperators(
            $intent['filters'] ?? [],
        );

        // add default filter for users, make sure current query is within pulse scope
        if ($modelKey === 'User') {
            $query->whereHas('pulseMemberships', function ($query) use (
                $pulseId
            ) {
                $query->where('pulse_id', $pulseId);
            });
        }

        if ($modelKey === 'Task') {
            $intent['filters'][] = [
                'column'   => 'entity_id',
                'operator' => '=',
                'value'    => $pulseId,
            ];
            if (isset($intent['task_query_kind'])) {
                if ($intent['task_query_kind'] === 'TASK') {
                    $intent['filters'][] = [
                        'column'   => 'type',
                        'operator' => '=',
                        'value'    => 'TASK',
                    ];
                }

                if ($intent['task_query_kind'] === 'TASK_LIST') {
                    $intent['filters'][] = [
                        'column'   => 'type',
                        'operator' => '=',
                        'value'    => 'LIST',
                    ];
                }
            }
        }

        // --- Filters ---
        if (! empty($intent['filters'])) {
            foreach ($intent['filters'] as $filter) {
                // Root model column filter
                if (isset($filter['column']) && ! isset($filter['relation'])) {
                    static::applyRootFilter($query, $modelKey, $filter);
                    // Related model filter
                } elseif (
                    isset($filter['relation']) && isset($filter['column'])
                ) {
                    static::applyRelationFilter($query, $modelKey, $filter);
                }
            }
        }

        // --- Order By ---
        if (! empty($intent['order_by'])) {
            foreach ($intent['order_by'] as $order) {
                $col = $order['column'] ?? null;
                $dir = strtolower($order['direction'] ?? 'asc');
                if (
                    $col && in_array($col, static::$allowedColumns[$modelKey], true) && in_array($dir, ['asc', 'desc'], true)
                ) {
                    $query->orderBy($col, $dir);
                }
            }
        }

        // --- Root-level Aggregate Support ---
        if (isset($intent['aggregate'])) {
            $agg      = $intent['aggregate'];
            $function = strtolower($agg['function'] ?? '');
            $column   = $agg['column'] ?? null;
            $as       = $agg['as']         ?? $function . '_' . $column;

            if (! in_array($function, static::$allowedAggregates, true)) {
                static::throw(
                    "Aggregate function '{$function}' is not allowed.",
                    [
                        'allowed_aggregates' => static::$allowedAggregates,
                    ],
                );
            }
            if (
                ! $column || ! in_array($column, static::$allowedColumns[$modelKey], true)
            ) {
                static::throw(
                    "Invalid aggregate column '{$column}' for model '{$modelKey}'.",
                    [
                        'allowed_columns' => static::$allowedColumns[$modelKey],
                    ],
                );
            }

            switch ($function) {
                case 'count':
                    $res = $query->count($column);
                    break;
                case 'sum':
                    $res = $query->sum($column);
                    break;
                case 'avg':
                    $res = $query->avg($column);
                    break;
                case 'max':
                    $res = $query->max($column);
                    break;
                case 'min':
                    $res = $query->min($column);
                    break;
                default:
                    static::throw(
                        "Unsupported aggregate function: {$function}",
                    );
            }
            return [$as => $res];
        }

        // --- Limit ---
        $limit = $intent['limit'] ?? static::$defaultLimit;
        $limit = min(max(1, (int) $limit), static::$maxLimit);
        $query->limit($limit);

        return $query->get();
    }

    /**
     * Recursively builds the eager load (`with`) array, auto-including required foreign keys.
     */
    protected static function buildWithArray(
        array $joins,
        string $modelKey,
    ): array {
        $with = [];

        foreach ($joins as $join) {
            $relationPath    = explode('.', $join['relation']);
            $selectColumns   = $join['select'] ?? null;
            $currentModelKey = $modelKey;
            $pointer         = &$with;

            foreach ($relationPath as $i => $relation) {
                $nextModelKey = static::getRelationModelKey(
                    $currentModelKey,
                    $relation,
                );

                $isLeaf = $i === count($relationPath) - 1;
                if ($isLeaf && $selectColumns) {
                    // Target relation; add PK (id) if not present
                    $requiredColumns = [];
                    if (! in_array('id', $selectColumns, true)) {
                        $requiredColumns[] = 'id';
                    }
                    $finalCols = array_unique(
                        array_merge($selectColumns, $requiredColumns),
                    );
                    $pointer[$relation] = function ($q) use ($finalCols) {
                        $q->select($finalCols);
                    };
                } elseif (! $isLeaf) {
                    if (
                        ! isset($pointer[$relation]) || ! is_array($pointer[$relation])
                    ) {
                        $pointer[$relation] = [];
                    }
                    if (is_array($pointer[$relation])) {
                        $pointer = &$pointer[$relation];
                    } else {
                        break;
                    }
                }
                $currentModelKey = $nextModelKey;
            }
            unset($pointer);
        }
        return $with;
    }

    protected static function getRelationForeignKey($modelKey, $relation)
    {
        $map = [
            'Task' => [
                'assignees' => 'id',
                'parent'    => 'parent_id',
                'subtasks'  => 'id',
            ],
            'Assignee' => [
                'user'   => 'user_id',
                'entity' => 'entity_id',
            ],
            'User' => [],
        ];
        return $map[$modelKey][$relation] ?? null;
    }

    protected static function applyRootFilter(
        Builder &$query,
        $modelKey,
        $filter,
    ) {
        $col = $filter['column'];
        $op  = strtoupper($filter['operator'] ?? '=');
        $val = $filter['value'];
        if (! in_array($col, static::$allowedColumns[$modelKey], true)) {
            static::throw(
                "Invalid filter column '{$col}' for model '{$modelKey}'.",
                [
                    'allowed_columns' => static::$allowedColumns[$modelKey],
                ],
            );
        }
        if (! in_array($op, static::$allowedOperators, true)) {
            static::throw("Invalid operator '{$op}'.", [
                'allowed_operators' => static::$allowedOperators,
            ]);
        }

        if ($op === 'IN') {
            if (! is_array($val)) {
                static::throw('Value for IN operator must be an array.');
            }
            $query->whereIn($col, $val);
        } else {
            $query->where($col, $op, $val);
        }
    }

    protected static function applyRelationFilter(
        Builder &$query,
        $modelKey,
        $filter,
    ) {
        $relation = $filter['relation'];
        $col      = $filter['column'];
        $op       = strtoupper($filter['operator'] ?? '=');
        $val      = $filter['value'];

        $relatedModelKey = static::validateAndResolveRelationPath(
            $modelKey,
            $relation,
        );
        if (! $relatedModelKey) {
            static::throw(
                "Relation '{$relation}' not allowed for model '{$modelKey}'.",
                [
                    'allowed_relations' => static::$allowedRelations[$modelKey],
                ],
            );
        }
        if (! in_array($col, static::$allowedColumns[$relatedModelKey], true)) {
            static::throw(
                "Column '{$col}' not allowed for relation '{$relation}' of model '{$modelKey}'.",
                [
                    'allowed_columns' => static::$allowedColumns[$relatedModelKey],
                ],
            );
        }
        if (! in_array($op, static::$allowedOperators, true)) {
            static::throw("Invalid operator '{$op}'.", [
                'allowed_operators' => static::$allowedOperators,
            ]);
        }

        $query->whereHas($relation, function ($q) use (
            $col,
            $op,
            $val,
            $modelKey,
            $relation
        ) {
            // Enforce morph filter for 'assignees' on Task root for any nested assignees.*
            if ($modelKey === 'Task' && strpos($relation, 'assignees') === 0) {
                $q->where('entity_type', '=', 'App\Models\Task');
            }
            if ($op === 'IN') {
                if (! is_array($val)) {
                    static::throw(
                        'Value for IN operator in relation filter must be an array.',
                    );
                }
                $q->whereIn($col, $val);
            } else {
                $q->where($col, $op, $val);
            }
        });
    }

    protected static function getRelationModelKey($modelKey, $relation)
    {
        $map = [
            'Task' => [
                'assignees' => 'Assignee',
                'parent'    => 'Task',
                'subtasks'  => 'Task',
            ],
            'User' => [
                'assignees' => 'Assignee',
                'tasks'     => 'Task',
            ],
            'Assignee' => [
                'user'   => 'User',
                'entity' => 'Task', // Usually Task, but can be polymorphic
            ],
        ];
        return $map[$modelKey][$relation] ?? null;
    }

    protected static function validateAndResolveRelationPath(
        string $modelKey,
        string $relationPath,
    ): ?string {
        $segments     = explode('.', $relationPath);
        $currentModel = $modelKey;

        foreach ($segments as $segment) {
            if (
                ! isset(static::$allowedRelations[$currentModel]) || ! in_array(
                    $segment,
                    static::$allowedRelations[$currentModel],
                    true,
                )
            ) {
                return null;
            }
            $currentModel = self::getRelationModelKey($currentModel, $segment);
            if (! $currentModel) {
                return null;
            }
        }
        return $currentModel;
    }

    protected static function throw($message, array $context = [])
    {
        Log::warning('[TaskQueryBuilder] ' . $message, $context);
        throw new InvalidArgumentException($message);
    }

    private static function _wrapWithPercent(string $value): string
    {
        if (! str_starts_with($value, '%')) {
            $value = '%' . $value;
        }
        if (! str_ends_with($value, '%')) {
            $value .= '%';
        }
        return $value;
    }

    protected static function preprocessOperators(array $filters = [])
    {
        return array_values(
            array_map(function ($item) {
                if (isset($item['operator']) && $item['operator'] === 'LIKE') {
                    $item['operator'] = 'ILIKE';
                    $item['value']    = static::_wrapWithPercent($item['value']);
                }
                return $item;
            }, $filters),
        );
    }

    public static function parseTaskDatesToUserTimezone(
        Collection $tasks,
        string $timezone,
    ) {
        return $tasks->map(function ($task) use ($timezone) {
            if ($task->due_date) {
                $task->due_date = Carbon::parse($task->due_date)->tz($timezone);
            }
            if ($task->created_at) {
                $task->created_at = Carbon::parse($task->created_at)->tz(
                    $timezone,
                );
            }
            if ($task->updated_at) {
                $task->updated_at = Carbon::parse($task->updated_at)->tz(
                    $timezone,
                );
            }
            return $task;
        });
    }
}
