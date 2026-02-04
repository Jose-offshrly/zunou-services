<?php

namespace App\Jobs;

use App\Services\SchedulerScaleService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class CheckDownscaleJob implements ShouldQueue
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
        $this->service->triggerScale('down', config('app.env'));
    }
}
