<?php

declare(strict_types=1);

namespace App\Actions\LiveInsightOutbox;

use App\Models\LiveInsightOutbox;
use App\Models\LiveInsightRecommendationAction;

final class RunLiveInsightRecommendationActionsAction
{
    public function handle(int $liveInsightOutboxId): void
    {
        $outbox = LiveInsightOutbox::findOrFail($liveInsightOutboxId);

        $actions = $outbox->recommendations()
            ->where('is_executed', false)
            ->with('actions.recommendation')
            ->get()
            ->pluck('actions')
            ->flatten();

        $executionData = ['ids' => []];

        $actions->each(function (LiveInsightRecommendationAction $action) use (&$executionData, $outbox) {
            $result = app('recommendation.action.factory')->make(
                $action->type
            )->execute($action, $outbox);

            if ($result) {
                $recommendation = $action->recommendation;
                $recommendation->is_executed = true;
                $recommendation->execution_result = $result['message'] ?? null;

                if (isset($result['id'])) {
                    $executionData['ids'][] = $result['id'];
                }

                $recommendation->execution_result_data = $executionData;
                $recommendation->save();
            }
        });
    }
}
