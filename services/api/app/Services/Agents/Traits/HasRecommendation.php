<?php

namespace App\Services\Agents\Traits;

use App\Models\LiveInsightRecommendation;
use App\Models\LiveInsightRecommendationAction;

trait HasRecommendation
{
    public ?LiveInsightRecommendation $recommendation = null;

    protected function saveRecommendationAction(string $type, string $method, array $data): ?LiveInsightRecommendationAction
    {
        if (! $this->recommendation) {
            return null;
        }

        return LiveInsightRecommendationAction::create([
            'live_insight_recommendation_id' => $this->recommendation->id,
            'method' => $method,
            'type' => $type,
            'data' => $data,
        ]);
    }

    public function saveFailedRecommendationAction(string $type, string $method, string $errorMessage, ?array $data = []): ?LiveInsightRecommendationAction
    {
        if (! $this->recommendation) {
            return null;
        }

        return LiveInsightRecommendationAction::create([
            'live_insight_recommendation_id' => $this->recommendation->id,
            'method' => $method,
            'type' => $type,
            'data' => $data,
            'status' => 'failed',
            'error_message' => $errorMessage,
        ]);
    }
}
