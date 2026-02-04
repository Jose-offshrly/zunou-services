<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;

class MonthlySummary extends BaseModel
{
    protected $fillable = [
        'organization_id',
        'pulse_id',
        'total_question_count',
        'total_user_count',
        'month',
        'year',
    ];

    public function scopeForPulse(Builder $query, string $pulseId): Builder
    {
        return $query->where('pulse_id', $pulseId);
    }

    public function getTotalMoneySavedAttribute()
    {
        // Assuming $1 saved per question answered
        return $this->total_question_count * 1;
    }

    public function getTotalTimeSavedAttribute()
    {
        // Assuming each question saves 5 minutes
        return $this->total_question_count * 5;
    }

    /**
     * Relationship to organization.
     */
    public function organization()
    {
        return $this->belongsTo(Organization::class);
    }
}
