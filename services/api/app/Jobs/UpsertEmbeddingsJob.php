<?php

namespace App\Jobs;

use App\Services\VectorDBService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class UpsertEmbeddingsJob implements ShouldQueue
{
    use Queueable;

    private array $documents;
    private string $orgId;
    private string $namespace;

    /**
     * Create a new job instance.
     */
    public function __construct(
        string $orgId,
        string $namespace,
        array $documents,
    ) {
        $this->orgId     = $orgId;
        $this->namespace = $namespace;
        $this->documents = $documents;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        try {
            $pc = new VectorDBService();
            $pc->upsertVectors(
                $this->orgId,
                $this->namespace,
                $this->documents,
            );
        } catch (\Exception $e) {
            throw new \Exception('Upsert failed: ' . $e->getMessage());
        }
    }
}
