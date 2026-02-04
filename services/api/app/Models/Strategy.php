<?php

namespace App\Models;

use App\Enums\StrategyType;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\SoftDeletes;

class Strategy extends BaseModel
{
    use SoftDeletes;

    protected $fillable = [
        'id',
        'organization_id',
        'pulse_id',
        'type',
        'name',
        'description',
        'prompt_description',
        'free_text',
        'status',
    ];

    protected $casts = [
        'type' => StrategyType::class,
    ];

    public function scopeForPulse(Builder $query, string $pulseId): Builder
    {
        return $query->where('pulse_id', $pulseId);
    }

    public function pulse()
    {
        return $this->belongsTo(Pulse::class);
    }
}
