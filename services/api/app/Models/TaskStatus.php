<?php

namespace App\Models;

use App\Enums\TaskStatusSystemType;
use App\Observers\TaskStatusObserver;
use Illuminate\Database\Eloquent\Attributes\ObservedBy;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[ObservedBy(TaskStatusObserver::class)]
class TaskStatus extends BaseModel
{
    protected $fillable = [
        'pulse_id',
        'label',
        'color',
        'type',
        'position',
        'system_type',
    ];

    protected $casts = [
        'system_type' => TaskStatusSystemType::class,
    ];

    public function pulse(): BelongsTo
    {
        return $this->belongsTo(Pulse::class);
    }

    public function scopeForPulse(Builder $query, array $args): Builder
    {
        return $query->where('pulse_id', $args['pulseId']);
    }
}
