<?php

namespace App\GraphQL\Mutations;

use App\Models\LiveInsightRecommendationAction;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class DismissRecommendationActionMutation
{
    public function __invoke($_, array $args): array
    {
        $userId = Auth::id();
        $input = $args['input'];

        // Find the action directly by ID
        $action = LiveInsightRecommendationAction::findOrFail(
            $input['recommendationActionsId']
        );

        // Validate that the action belongs to the current user
        if ($action->user_id !== $userId) {
            abort(403, 'Access denied. This action does not belong to you.');
        }

        // Soft delete the action
        $action->delete();

        Log::info('Dismissed recommendation action', [
            'action_id' => $action->id,
            'recommendation_id' => $action->live_insight_recommendation_id,
            'type' => $action->type,
            'user_id' => $userId,
        ]);

        return [
            'success' => true,
            'message' => 'Recommendation action dismissed successfully.',
        ];
    }
}
