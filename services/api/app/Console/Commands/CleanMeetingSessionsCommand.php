<?php

namespace App\Console\Commands;

use App\Jobs\CleanMeetingSessionsJob;
use Illuminate\Console\Command;

class CleanMeetingSessionsCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'meeting-sessions:clean';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Clean meeting sessions with status not_admitted or past end_at time';

    /**
     * Execute the console command.
     */
    public function handle(): void
    {
        $this->info('Dispatching CleanMeetingSessionsJob...');
        
        CleanMeetingSessionsJob::dispatch();
        
        $this->info('CleanMeetingSessionsJob dispatched successfully!');
    }
}
