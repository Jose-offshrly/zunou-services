<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TaskPhase extends BaseModel
{
    protected $fillable = [
        'pulse_id',
        'label',
        'color',
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
