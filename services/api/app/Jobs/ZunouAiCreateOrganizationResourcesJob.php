<?php

namespace App\Jobs;

use App\Models\Organization;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Config;

class ZunouAiCreateOrganizationResourcesJob implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    protected $organizationId;

    /**
     * Create a new job instance.
     */
    public function __construct($organizationId)
    {
        $this->organizationId = $organizationId;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        $organization = Organization::find($this->organizationId);
        if (! $organization) {
            throw new \Exception("The organization couldn't be found");
        }

        $headers = [
            'API-Token'    => Config::get('zunou.ai.token'),
            'Content-Type' => 'application/json',
        ];

        // Send job to create organization vector index
        CreateOrganizationVectorIndexJob::dispatch($organization->id);
    }
}
