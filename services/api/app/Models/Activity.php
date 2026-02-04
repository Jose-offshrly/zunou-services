<?php

namespace App\Models;

use Illuminate\Support\Carbon;
use Spatie\Activitylog\Models\Activity as SpatieActivity;

class Activity extends SpatieActivity
{
    protected $table = 'activity_log';

    protected $casts = [
        'properties' => 'array',
    ];

    public function scopeThisWeek($query)
    {
        return $query->whereBetween('created_at', [
            Carbon::now()->startOfWeek(), // default: Monday
            Carbon::now()->endOfWeek(), // end of week = Sunday 23:59:59
        ]);
    }

    public function getCreatedAtAttribute(): string
    {
        return Carbon::parse($this->attributes['created_at'])->userTimezone();
    }
}
