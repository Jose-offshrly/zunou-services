<?php

namespace App\Jobs;

use App\Mail\InviteUser;
use App\Models\OrganizationUser;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Mail;

class InviteUserJob implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    protected $organizationUserId;

    protected $existing;

    /**
     * Create a new job instance.
     */
    public function __construct($organizationUserId, $existing = false)
    {
        $this->organizationUserId = $organizationUserId;
        $this->existing           = $existing;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        $organizationUser = OrganizationUser::findOrFail(
            $this->organizationUserId,
        );

        Mail::to($organizationUser->user->email)->send(
            new InviteUser($organizationUser, $this->existing),
        );
    }
}
