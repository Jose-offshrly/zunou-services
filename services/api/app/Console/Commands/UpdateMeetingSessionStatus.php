<?php

namespace App\Console\Commands;

use App\Concerns\CompanionHandler;
use App\Enums\MeetingSessionStatus;
use App\Models\MeetingSession;
use Exception;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Log;

class UpdateMeetingSessionStatus extends Command
{
    use CompanionHandler;

    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'meeting-session:update';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Update meeting session status to active if the meeting is today';

    /**
     * Execute the console command.
     */
    public function handle(): void
    {
        $today = Carbon::today()->toDateString();
        $this->info("Starting meeting session status update for: {$today}");

        try {
            $now      = Carbon::now();
            $from     = $now->copy()->subMinutes(2);
            $to       = $now->copy()->addMinutes(2);
            $sessions = MeetingSession::query()
                ->where('status', MeetingSessionStatus::INACTIVE->value)
                ->where(function ($query) use ($from, $to, $now) {
                    $query
                        ->whereBetween('start_at', [$from, $to])
                        ->orWhere(function ($subQuery) use ($now) {
                            $subQuery
                                ->where('start_at', '<', $now)
                                ->where('end_at', '>', $now);
                        });
                })
                ->get();

            if ($sessions->isEmpty()) {
                $this->info('No meeting sessions scheduled for today.');
                Log::info("No meeting sessions found for {$today}.");

                return;
            }

            $updated = 0;

            foreach ($sessions as $session) {
                if ($session->status !== MeetingSessionStatus::ACTIVE) {
                    if ($session->invite_pulse) {
                        $this->startMeetingSession(meetingSession: $session);
                    }
                    $session->status = MeetingSessionStatus::ACTIVE->value;
                    $session->save();
                    $updated++;
                    Log::info(
                        "Updated meeting session ID {$session->id} to active.",
                    );
                } else {
                    Log::info(
                        "Meeting session ID {$session->id} is already active. Skipping.",
                    );
                }
            }

            $this->info(
                "Successfully updated {$updated} meeting session(s) to active.",
            );
            Log::info(
                "Meeting session status update complete for {$today}. {$updated} session(s) updated.",
            );
        } catch (Exception $e) {
            $this->error('An error occurred while updating meeting statuses.');
            Log::error(
                "Failed to update meeting session statuses for {$today}: ".
                    $e->getMessage(),
                [
                    'exception' => $e,
                ],
            );
        }
    }
}
