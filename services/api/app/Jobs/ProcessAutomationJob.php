<?php

namespace App\Jobs;

use App\Models\Automation;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class ProcessAutomationJob implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    protected string $automationId;
    protected bool $isScheduled;
    protected ?string $dataSourceId;
    /**
     * Create a new job instance.
     */
    public function __construct(
        string $automationId,
        bool $isScheduled = false,
        ?string $dataSourceId = null,
    ) {
        //
        $this->automationId = $automationId;
        $this->isScheduled  = $isScheduled;
        $this->dataSourceId = $dataSourceId;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        //
        $automation = Automation::find($this->automationId);

        if (! $automation) {
            Log::error("Automation not found with ID: {$this->automationId}");
            return;
        }

        try {
            $success = $automation->run(
                isScheduled: $this->isScheduled,
                dataSourceId: $this->dataSourceId,
            );
        } catch (\Exception $e) {
            Log::error('Failed to run automation: ' . $e->getMessage());
        } finally {
            $automation->on_queue = true;
            $automation->save();
        }
    }
}
