<?php

namespace App\Console\Commands;

use App\Jobs\NewPulseSeedToVectorDB;
use Illuminate\Console\Command;

class RunNewPulseSeedToVectorDB extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'run:seed-org-pulse {organizationId} {pulseId}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Run the NewPulseSeedToVectorDB job for an organization and pulseId';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        // Get the organizationId from the command arguments
        $organizationId = $this->argument('organizationId');

        // Dispatch the job
        NewPulseSeedToVectorDB::dispatch($organizationId);

        // Output a message to the console
        $this->info(
            'NewPulseSeedToVectorDB job dispatched for organization: ' .
                $organizationId,
        );
    }
}
