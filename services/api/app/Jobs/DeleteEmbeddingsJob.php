<?php

namespace App\Jobs;

use App\Services\VectorDBService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class DeleteEmbeddingsJob implements ShouldQueue
{
    use Queueable;

    private array $ids;
    private string $orgId;
    private string $namespace;

    /**
     * Create a new job instance.
     */
    public function __construct(string $orgId, string $namespace, array $ids)
    {
        $this->orgId     = $orgId;
        $this->namespace = $namespace;
        $this->ids       = $ids;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        try {
            $pc = new VectorDBService();
            $pc->deleteById($this->orgId, $this->namespace, $this->ids);
        } catch (\Exception $e) {
            throw new \Exception('Delete failed: ' . $e->getMessage());
        }
    }
}
