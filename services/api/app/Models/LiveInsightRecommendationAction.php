<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class LiveInsightRecommendationAction extends Model
{
    use SoftDeletes;
    protected $table = 'live_insight_recommendation_actions';
    public $timestamps = false;

    protected $fillable = [
        'type',
        'method',
        'data',
        'live_insight_recommendation_id',
        'user_id',
        'status',
        'error_message',
    ];

    protected $casts = [
        'data' => 'array',
    ];

    public function getMethodAttribute($value)
    {
        return str_replace(':', '_', $value);
    }

    public function recommendation(): BelongsTo
    {
        return $this->belongsTo(
            LiveInsightRecommendation::class,
            'live_insight_recommendation_id'
        );
    }

    /**
     * Scope: only actions for the given user.
     */
    public function scopeForUser($query, string $userId)
    {
        return $query->where('user_id', $userId);
    }
}
