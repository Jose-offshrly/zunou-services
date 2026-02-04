<?php

namespace App\Console\Commands;

use App\Mail\UserDeletedConfirmationMail;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Mail;

class ProcessDeletedUsers extends Command
{
    protected $signature = 'users:process-deleted';

    protected $description = 'Process users that have been soft deleted for 30 days and send confirmation email';

    public function handle(): void
    {
        $thirtyDaysAgo = Carbon::now()->subDays(30);

        // Get users that were soft deleted 30+ days ago
        $users = User::onlyTrashed()
            ->where('deleted_at', '<=', $thirtyDaysAgo)
            ->get();

        if ($users->isEmpty()) {
            $this->info('No users found for permanent deletion.');

            return;
        }

        $count = 0;

        foreach ($users as $user) {
            // Send confirmation email
            Mail::to($user->email)->send(
                new UserDeletedConfirmationMail($user->name)
            );

            // Permanently delete the user
            $user->forceDelete();

            $count++;

            $this->line("Processed user: {$user->email}");
        }

        $this->info("Permanently deleted {$count} user(s) and sent confirmation emails.");
    }
}

