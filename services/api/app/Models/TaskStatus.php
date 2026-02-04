<?php

namespace App\Models;

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
