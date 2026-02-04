<?php

namespace App\Jobs;

use App\Services\Seeders\GettingStartedSeeder;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class NewPulseSeedGettingStartedJob implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    protected string $organizationId;
    protected string $pulseId;

    /**
     * Create a new job instance.
     *
     * @param string $organizationId
     * @param string $pulseId
     */
    public function __construct(string $organizationId, string $pulseId)
    {
        $this->organizationId = $organizationId;
        $this->pulseId        = $pulseId;
    }

    /**
     * Execute the job.
     *
     * @return void
     */
    public function handle(GettingStartedSeeder $gettingStartedSeeder)
    {
        try {
            // Call the GettingStartedSeeder to seed data
            $gettingStartedSeeder->seedGettingStartedData(
                $this->organizationId,
                $this->pulseId,
            );
            Log::info(
                "SeedGettingStartedJob successfully completed for organization: {$this->organizationId} and pulse: {$this->pulseId}",
            );
        } catch (\Exception $e) {
            Log::error('SeedGettingStartedJob failed: ' . $e->getMessage());
        }
    }
}
