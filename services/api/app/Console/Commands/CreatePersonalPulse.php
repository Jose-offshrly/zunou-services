<?php

namespace App\Console\Commands;

use App\Actions\Pulse\CreatePulseAction;
use App\DataTransferObjects\Pulse\PulseData;
use App\Enums\PulseCategory;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class CreatePersonalPulse extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'pulse:create-personal {organization_id} {user_id}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Create a PERSONAL pulse for a user and add them as a member.';

    /**
     * Execute the console command.
     */
    public function handle(): void
    {
        $organizationId = $this->argument('organization_id');
        $userId         = $this->argument('user_id');

        $user = User::find($userId);
        if (! $user) {
            $this->error("User not found with ID: $userId");

            return;
        }

        $pulseName = $user->name . "'s Personal Pulse";

        $pulseData = new PulseData(
            name: $pulseName,
            organizationId: $organizationId,
            category: PulseCategory::PERSONAL->value,
            userId: $user->id,
        );

        $createPulseAction = app(CreatePulseAction::class);
        $createPulseAction->handle($pulseData);
        Log::info("PERSONAL pulse created for user {$user->id}");

        $this->info(
            "Created PERSONAL pulse '{$pulseName}' for user '{$user->name}' and added them as OWNER.",
        );
    }
}
