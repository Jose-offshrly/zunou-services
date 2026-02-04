<?php

namespace App\Jobs;

use App\Services\Seeders\VectorDBSeedService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class NewPulseSeedToVectorDB implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    protected $organizationId;
    protected $pulseId;

    public function __construct($organizationId, $pulseId)
    {
        $this->organizationId = $organizationId;
        $this->pulseId        = $pulseId;
    }

    public function handle(): void
    {
        try {
            Log::info(
                "Seeding vector data for organization {$this->organizationId} and pulse {$this->pulseId}",
            );
            app(VectorDBSeedService::class)->seedVectorData(
                $this->organizationId,
                $this->pulseId,
            );
        } catch (\Exception $e) {
            Log::error("Error seeding data to vector DB: {$e->getMessage()}");
        }
    }
}
