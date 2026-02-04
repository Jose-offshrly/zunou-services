<?php

namespace App\Jobs;

use App\Models\LiveInsightOutbox;
use App\Models\Meeting;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class LiveInsightsWorkerJob implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public function handle()
    {
        try {
            $cacheListKey = "insights:processing";
            $allRunningInsights = Cache::store('file')->get($cacheListKey, []);

            // get all the insights that doesnt have a recommendation based on item_hash
            $insights = DB::table('live_insight_outbox as o')
                ->selectRaw('MIN(o.id) as id, o.item_hash')
                ->leftJoin('live_insight_outbox_recommendation as r', 'o.id', '=', 'r.live_insight_outbox_id')
                ->whereNull('r.live_insight_recommendation_id')
                ->whereNotIn('o.item_hash', $allRunningInsights)
                ->where('o.created_at', '>=', now()->subMinutes(2))
                ->groupBy('o.item_hash')
                ->orderByRaw('MIN(o.created_at)')
                ->get();

            if ($insights->isEmpty()) {
                Log::info("LiveInsightsWorkerJob: No insights to process");
                return;
            }

            $processedCount = 0;
            $skippedCount = 0;
            $insightsFetchedButAlreadyProcessing = [];

            foreach ($insights as $insight) {
                $cacheKey = "insights:processing:{$insight->item_hash}";
                $hit = Cache::store('file')->get($cacheKey);
                
                if ($hit) {
                    $insightsFetchedButAlreadyProcessing[] = $insight->item_hash;
                    $skippedCount++;
                    continue;
                }
                
                Cache::store('file')->put($cacheKey, true, now()->addMinutes(10));
                InsightRecommendationGeneratorJob::dispatch($insight->id)->onQueue('default');
                $processedCount++;
            }

            Log::info("LiveInsightsWorkerJob: Processing {$processedCount} insights, skipped {$skippedCount}");

            if (!empty($insightsFetchedButAlreadyProcessing)) {
                $ttl = now()->addHours(1); 
                Cache::store('file')->put(
                    $cacheListKey, 
                    array_merge($allRunningInsights, $insightsFetchedButAlreadyProcessing), 
                    $ttl
                );
            }
        } catch (\Exception $e) {
            Log::error("LiveInsightsWorkerJob: Error " . $e->getMessage(), [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'insights' => $insights,
                'allRunningInsights' => $allRunningInsights,
            ]);
        }
    }
}