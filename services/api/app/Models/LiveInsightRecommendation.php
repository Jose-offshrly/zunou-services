<?php

namespace App\Models;

use Exception;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Log;

class LiveInsightRecommendation extends Model
{
    protected $table = 'live_insight_recommendations';
    public $timestamps = true;

    protected $fillable = [
        'title', 
        'summary',
        'is_executed',
        'executed_by_id',
        'execution_result',
        'execution_result_data',
        'created_at', 
        'updated_at',
    ];

    protected $casts = [
        'is_executed'  => 'boolean',
        'execution_result_data' => 'array',
        'created_at'   => 'datetime',
        'updated_at'   => 'datetime',
    ];

    public function outboxes()
    {
        return $this->belongsToMany(
            LiveInsightOutbox::class,
            'live_insight_outbox_recommendation',
            'live_insight_recommendation_id',
            'live_insight_outbox_id'
        )->withPivot('user_id')
          ->withTimestamps();
    }

    /**
     * Get outbox for a specific user and recommendation.
     */
    public function outboxForUser(string $userId)
    {
        return $this->outboxes()
            ->wherePivot('user_id', $userId)
            ->first();
    }

    public function actions()
    {
        return $this->hasMany(LiveInsightRecommendationAction::class, 'live_insight_recommendation_id');
    }

    public function actionForUser(?string $userId = null)
    {
        $userId = $userId ?? auth()->id();

        if (!$userId) {
            throw new Exception("No user logged in");
        }

        return $this->hasOne(
            LiveInsightRecommendationAction::class,
            'live_insight_recommendation_id'
        )->where('user_id', $userId);
    }

    public function executedBy()
    {
        return $this->belongsTo(User::class, 'executed_by_id');
    }
}