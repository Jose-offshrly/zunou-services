<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;

class MonthlyQuestion extends BaseModel
{
    protected $fillable = [
        'organization_id',
        'pulse_id',
        'month',
        'year',
        'question',
        'rank',
    ];

    public function scopeForPulse(Builder $query, string $pulseId): Builder
    {
        return $query->where('pulse_id', $pulseId);
    }

    public function organization()
    {
        return $this->belongsTo(Organization::class);
    }
}
