<?php

namespace App\Console\Commands;

use App\DataTransferObjects\IntegrationData;
use App\Jobs\ProcessFireFliesMeetingsJob;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class FetchFireFliesMeeting extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'fireflies:fetch-meetings';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Command description';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        User::whereHas('integrations', function ($query) {
            $query->where('type', 'fireflies');
        })
            ->with('integrations')
            ->get()
            ->each(function ($user) {
                Log::info('Loop each user');
                $user->integrations
                    ->where('type', 'fireflies') // Filter using collection methods
                    ->each(function ($integration) use ($user) {
                        Log::info('Loop integrations and map integration data');
                        $data = new IntegrationData(
                            user_id: $user->id,
                            pulse_id: $integration->pulse_id ?? '',
                            type: $integration->type,
                            api_key: $integration->api_key ?? '',
                        );

                        Log::info('Start: ProcessFireFliesMeetingsJob');
                        ProcessFireFliesMeetingsJob::dispatch(
                            data: $data,
                            user: $user,
                        );
                    });
            });
    }
}
