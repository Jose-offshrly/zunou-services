<?php

namespace App\Console\Commands;

use App\Jobs\InsightRecommendationGeneratorJob;
use App\Models\LiveInsightOutbox;
use App\Models\LiveInsightRecommendationAction;
use App\Models\ScheduledJob;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class AddInsightRecommendations extends Command
{
    const NO_RECOMMENDATIONS = "NO_RECOMMENDATIONS";
    const FAILED_INSIGHTS = "FAILED_INSIGHTS";
    const ALL_INSIGHTS = "ALL_INSIGHTS";

    /**
     * The name and signature of the console command.
     *
     * Usage:
     *  php artisan app:add-insight-recommendations {organizationId?} {filter?} {countPerBatch?} {delayIntervalMinutes?}
     *
     * @var string
     */
    protected $signature = 'app:add-insight-recommendations
        {organizationId? : Optional organization ID to scope insights}
        {filter? : Filter to apply (NO_RECOMMENDATIONS | ALL_INSIGHTS | FAILED_INSIGHTS)}
        {countPerBatch? : Number of insights to process per batch}
        {delayIntervalMinutes? : Delay (in minutes) between batches}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Populate insights with generated recommendations based on the specified filter and batch configuration.';

    /**
     * Execute the console command.
     *
     * @return void
     *
     * @param string|null $organizationId      Optional organization ID to filter insights.
     * @param string|null $filter              Determines which insights to fetch:
     *                                         - NO_RECOMMENDATIONS: Insights without recommendations (default)
     *                                         - ALL_INSIGHTS: All insights
     *                                         - FAILED_INSIGHTS: Failed ones
     * @param int|null    $countPerBatch       Number of insights to dispatch per batch. Default = 5.
     * @param int|null    $delayIntervalMinutes Delay (in minutes) between batches. Default = 1.
     */
    public function handle()
    {
        $defaultInterval = 1; // minute
        $countPerBatchDefault = 5;

        $organizationId = $this->argument("organizationId") ?? null;
        if ($organizationId === "null" || $organizationId === "") {
            $organizationId = null;
        }
        $delayInterval = (int) ($this->argument("delayIntervalMinutes") ?? $defaultInterval);

        $countPerBatch = $this->argument("countPerBatch") ?? $countPerBatchDefault;

        $filter = $this->argument("filter") ?? self::NO_RECOMMENDATIONS;

        $valid = $this->validateFilter($filter);
        if (!$valid) {
            $this->info(
                "The filter should be one of: " .
                self::NO_RECOMMENDATIONS . ", " .
                self::ALL_INSIGHTS . ", " .
                self::FAILED_INSIGHTS
            );
            return;
        }

        if ($filter === self::NO_RECOMMENDATIONS) {
            $insights = DB::table('live_insight_outbox as o')
                ->when($organizationId, function ($query) use ($organizationId) {
                    return $query->where('o.organization_id', $organizationId);
                })
                ->selectRaw('MIN(o.id) as id, o.item_hash')
                ->leftJoin('live_insight_outbox_recommendation as r', 'o.id', '=', 'r.live_insight_outbox_id')
                ->whereNull('r.live_insight_recommendation_id')
                ->groupBy('o.item_hash')
                ->orderByRaw('MIN(o.created_at)')
                ->get();
        }

        if ($filter === self::ALL_INSIGHTS) {
            $insights = DB::table('live_insight_outbox as o')
                ->when($organizationId, function ($query) use ($organizationId) {
                    return $query->where('o.organization_id', $organizationId);
                })
                ->selectRaw('MIN(o.id) as id, o.item_hash')
                ->groupBy('o.item_hash')
                ->orderByRaw('MIN(o.created_at)')
                ->get();
        }

        if ($filter === self::FAILED_INSIGHTS) {
            $failedRecommendations = LiveInsightRecommendationAction::with([
                'recommendation.outboxes'
            ])
                ->where('status', 'failed')
                ->when($organizationId, function ($query) use ($organizationId) {
                    $query->whereHas('recommendation.outboxes', fn($q) => $q->where('organization_id', $organizationId));
                })
                ->get();

            $insights = $failedRecommendations
                ->pluck('recommendation.outboxes')
                ->flatten()
                ->unique('id')
                ->values();
        }
        
        $this->info("Found {$insights->count()} insights to process");

        $insights->chunk($countPerBatch)->each(function ($items, $index) use ($delayInterval, $filter) {
            foreach ($items as $item) {
                if ($filter === self::FAILED_INSIGHTS) {
                    $item->recommendations->each->delete();
                }

                if ($filter === self::ALL_INSIGHTS) {
                    $outbox = LiveInsightOutbox::with("recommendations")->find($item->id);
                    $outbox->recommendations->each->delete();
                }
                
                if ($index === 0) {
                    // immediately dispatch the first batch
                    InsightRecommendationGeneratorJob::dispatch($item->id)->onQueue('default');
                    $this->info("Dispatched insight: {$item->id} - {$item->item_hash}");
                    continue;
                }

                $delayIntervalMinutes = $delayInterval * $index;
                $scheduleTime = Carbon::now('UTC')->addMinutes($delayIntervalMinutes);
                ScheduledJob::create([
                    'on_queue' => true,
                    'job_class' => InsightRecommendationGeneratorJob::class,
                    'payload' => $item->id,
                    'next_run_at' => $scheduleTime,
                ]);
                $this->info("Scheduled insight: {$item->id} - {$item->item_hash}. Will run at {$scheduleTime->format('Y-m-d H:i:s')}");

            }
        });
    }

    private function validateFilter($filter) {
        return in_array($filter, [self::ALL_INSIGHTS, self::FAILED_INSIGHTS, self::NO_RECOMMENDATIONS]);
    }
}
