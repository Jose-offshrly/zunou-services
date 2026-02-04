<?php

namespace App\Jobs;

use App\Models\Organization;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Config;
use Probots\Pinecone\Client as Pinecone;

class CreateOrganizationVectorIndexJob implements ShouldQueue
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
        // retrieve organization
        $organization = Organization::findOrFail($this->organizationId);

        // if the organization_id doesn't exist, then throw an error
        if (! $organization->id) {
            throw new \Exception('The organization does not exist');
        }
        // get api key from config
        $pineConeApiKey = Config::get('zunou.pinecone.api_key');

        // initiate pinecone client
        $pinecone = new Pinecone($pineConeApiKey);

        // create index
        $indexName = $this->organizationId;
        $pinecone
            ->control()
            ->index($indexName)
            ->createServerless(
                dimension: 1536,
                metric: 'cosine',
                cloud: 'aws',
                region: 'us-east-1',
            );
    }
}
