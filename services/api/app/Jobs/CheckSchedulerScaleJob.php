<?php

namespace App\Jobs;

use App\Services\SchedulerScaleService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class CheckSchedulerScaleJob implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public function __construct(
        protected ?SchedulerScaleService $service = null,
    ) {
        $this->service = $this->service ?: app(SchedulerScaleService::class);
    }

    public function handle(): void
    {
        try {
            $data = $this->service->getStatus();

            Log::info('Scheduler scale response received', $data);

            // Validate response shape early
            if (! isset($data['ecs']['running'], $data['meetings']['active'])) {
                Log::warning('Unexpected response structure from scheduler scale endpoint', $data);
                return;
            }

            $running        = $data['ecs']['running'];
            $activeMeetings = $data['meetings']['active'];
            $maxInstances   = $data['capacity']['maxInstances'] ?? 0;
            $difference     = $running - $activeMeetings;

            // If max instances is defined and we've reached or exceeded it, fail fast
            if ($maxInstances > 0 && $running >= $maxInstances) {
                Log::info('Max instances reached - cannot scale up further', [
                    'running_instances' => $running,
                    'active_meetings'   => $activeMeetings,
                    'max_instances'     => $maxInstances,
                    'difference'        => $difference,
                ]);

                throw new \Exception('bots all used up. please try again later');
            }

            // If we already have at least 2 spare instances, proceed
            if ($difference >= 2) {
                Log::info('Capacity sufficient - at least 2 extra instances available', [
                    'running_instances' => $running,
                    'active_meetings'   => $activeMeetings,
                    'difference'        => $difference,
                ]);

                return;
            }

            // Not enough capacity: need to add at least one
            // If we're at max, the early check above would have thrown

            // Only scale up once when difference is exactly 1
            if ($difference === 1) {
                // Exactly one spare instance left: trigger scale and inform user to retry later
                Log::info('One spare instance left - triggering scale up by one and notifying user', [
                    'running_instances' => $running,
                    'active_meetings'   => $activeMeetings,
                    'difference'        => $difference,
                ]);

                $this->service->triggerscale('up', (string) config('app.env'));
            }

            return;

        } catch (\Exception $e) {
            Log::error('Exception occurred while checking scheduler scale', [
                'message' => $e->getMessage(),
                'trace'   => $e->getTraceAsString(),
            ]);
            throw $e;
        }
    }
}
