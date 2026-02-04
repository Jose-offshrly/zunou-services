<?php 

namespace App\Jobs\Middleware;

use Closure;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class LogQueryPerformanceMiddleware
{
    public function handle($job, Closure $next)
    {
        $isOnDevelopment = app()->environment(['development', 'testing']);
        if ($isOnDevelopment) {
            DB::flushQueryLog();
            DB::enableQueryLog();
        }

        $next($job);

        if ($isOnDevelopment) {
            $queries = DB::getQueryLog();

            if (!empty($queries)) {

                // Compute total time + get slowest query
                $totalTime = 0;
                $slowest = null;

                foreach ($queries as $q) {
                    $totalTime += $q['time'];

                    if ($slowest === null || $q['time'] > $slowest['time']) {
                        $slowest = $q;
                    }
                }

                // Sort by slowest
                $sorted = $queries;
                usort($sorted, fn ($a, $b) => $b['time'] <=> $a['time']);

                $top5 = array_slice($sorted, 0, 5);

                Log::info("📊 DB Query Performance Report", [
                    'total_queries' => count($queries),
                    'total_time_ms' => $totalTime,
                    'average_time_ms' => round($totalTime / count($queries), 2),
                    'slowest_query' => [
                        'sql' => $slowest['query'],
                        'bindings' => $slowest['bindings'],
                        'time_ms' => $slowest['time'],
                    ],
                    'top_5_slowest' => array_map(function ($q) {
                        return [
                            'sql' => $q['query'],
                            'bindings' => $q['bindings'],
                            'time_ms' => $q['time'],
                        ];
                    }, $top5),
                ]);

                // Optional: dump ALL queries individually
                // foreach ($queries as $q) {
                //     Log::debug("DB Query", [
                //         'sql' => $q['query'],
                //         'bindings' => $q['bindings'],
                //         'time_ms' => $q['time'],
                //     ]);
                // }
            }
        }
    }
}
