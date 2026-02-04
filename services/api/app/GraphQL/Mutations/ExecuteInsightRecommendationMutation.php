<?php

namespace App\GraphQL\Mutations;

use App\Models\LiveInsightOutbox;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class ExecuteInsightRecommendationMutation
{
    public function __invoke($_, array $args): array
    {
        $userId = Auth::id();
        $outbox = LiveInsightOutbox::findOrFail($args['input']['insightId']);

        if (
            $outbox->user_id !== $userId ||
            $outbox->pulse_id !== $args['input']['pulseId'] ||
            $outbox->organization_id !== $args['input']['organizationId']
        ) {
            abort(404, 'Outbox not found.');
        }

        $recommendation = $outbox->recommendations()
            ->whereKey($args['input']['recommendationId'])
            ->firstOrFail();

        $action = $recommendation->actionForUser()->first();
        if (!$action) {
            return [
                'success' => false,
                'message' => 'This recommendation is not ready at the moment. Please try again later.'
            ];
        }

        if ($recommendation->is_executed) {
            return [
                'success' => ($action->status === 'failed') ? false : true,
                'message' => $recommendation->execution_result
            ];
        }

        if ($action->status === 'failed') {
            $message = $action->error_message ?? 'Failed to execute insight recommendation';
            $recommendation = $action->recommendation;
            $recommendation->is_executed = true;
            $recommendation->executed_by_id = $userId;
            $recommendation->execution_result = $message;

            $recommendation->save();
            
            return [
                'success' => false,
                'message' => $message
            ];
        }

        $result = app('recommendation.action.factory')->make($action->type)->execute($action, $outbox);
        
        // make the message property required in result
        $message = $result['message'];
        $recommendation->is_executed = true;
        $recommendation->executed_by_id = $userId;
        $recommendation->execution_result = $message;
        
        $actionFailed = $result["error"] ?? false;

        if ($actionFailed) {
            // mark the action as failed if encounter problem while executing the action
            $action->status = 'failed';
            $action->error_message = $message;
        }
        
        if (isset($result['id'])) {
            $executionData = $recommendation->execution_result_data ?? ['ids' => []];
            
            if (!isset($executionData['ids'])) {
                $executionData['ids'] = [];
            }

            $executionData['ids'][] = $result['id'];
            $recommendation->execution_result_data = $executionData;
        }

        $action->save();
        $recommendation->save();

        $status = ($action->status === 'failed' || $actionFailed) ? false : true;
        return [
            'success' => $status,
            'message' => $message
        ];
    }
}
