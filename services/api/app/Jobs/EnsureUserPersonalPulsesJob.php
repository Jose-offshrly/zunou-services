<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Models\User;
use App\Services\PersonalPulseService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

/**
 * Job to ensure a user has personal pulses for all their organizations
 */
class EnsureUserPersonalPulsesJob implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    /**
     * Create a new job instance
     */
    public function __construct(public User $user)
    {
    }

    /**
     * Execute the job
     */
    public function handle(): void
    {
        Log::info(
            "Processing personal pulse check job for user {$this->user->id}",
        );

        $organizationIds = $this->user->organizationIds();

        Log::info(
            "Checking personal pulses for user {$this->user->id} across " .
                count($organizationIds) .
                ' organizations',
        );

        foreach ($organizationIds as $organizationId) {
            PersonalPulseService::ensureUserHasPersonalPulse(
                $this->user,
                $organizationId,
            );
        }

        Log::info(
            "Completed personal pulse check job for user {$this->user->id}",
        );
    }

    /**
     * Handle a job failure
     */
    public function failed(\Throwable $exception): void
    {
        Log::error(
            "Personal pulse check job failed for user {$this->user->id}: {$exception->getMessage()}",
        );
    }
}
