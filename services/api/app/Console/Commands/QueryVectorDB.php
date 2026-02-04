<?php

namespace App\Console\Commands;

use App\Services\VectorDBService;
use Illuminate\Console\Command;

class QueryVectorDB extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'vector:query
                            {orgId : The organization ID}
                            {pulseId : The pulse ID (namespace)}
                            {keywords : The search keywords}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Query the vector database with keywords for a specific organization and pulse ID';

    protected $vectorDBService;

    /**
     * Create a new command instance.
     *
     * @param VectorDBService $vectorDBService
     */
    public function __construct(VectorDBService $vectorDBService)
    {
        parent::__construct();
        $this->vectorDBService = $vectorDBService;
    }

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $orgId    = $this->argument('orgId');
        $pulseId  = $this->argument('pulseId');
        $keywords = $this->argument('keywords');

        $this->info('Querying the vector database...');
        $this->info("Organization ID: $orgId");
        $this->info("Pulse ID: $pulseId");
        $this->info("Keywords: $keywords");

        try {
            $response = $this->vectorDBService->search(
                $keywords,
                $orgId,
                $pulseId,
            );
            $this->info('Search Results:');
            $this->line($response);
        } catch (\Exception $e) {
            $this->error(
                'Error querying the vector database: ' . $e->getMessage(),
            );
        }
    }
}
