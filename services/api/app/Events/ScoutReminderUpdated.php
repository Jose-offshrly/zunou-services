<?php

namespace App\Events;

use App\Models\ScoutReminderResult;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ScoutReminderUpdated implements ShouldBroadcast
{
    use Dispatchable;
    use InteractsWithSockets;
    use SerializesModels;

    public ScoutReminderResult $scoutReminderResult;

    /**
     * Create a new event instance.
     */
    public function __construct(ScoutReminderResult $scoutReminderResult)
    {
        $this->scoutReminderResult = $scoutReminderResult;
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        return [
            new Channel(
                'scout-reminders.' .
                    $this->scoutReminderResult->user_id .
                    '.' .
                    $this->scoutReminderResult->organization_id .
                    '.' .
                    $this->scoutReminderResult->pulse_id,
            ),
        ];
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'scout-reminder-updated';
    }

    /**
     * Get the data to broadcast.
     */
    public function broadcastWith(): array
    {
        return [
            'id'              => $this->scoutReminderResult->id,
            'user_id'         => $this->scoutReminderResult->user_id,
            'organization_id' => $this->scoutReminderResult->organization_id,
            'pulse_id'        => $this->scoutReminderResult->pulse_id,
            'scope'           => $this->scoutReminderResult->scope,
            'status'          => $this->scoutReminderResult->status,
            'result'          => $this->scoutReminderResult->result,
            'job_id'          => $this->scoutReminderResult->job_id,
            'error_message'   => $this->scoutReminderResult->error_message,
            'generated_at'    => $this->scoutReminderResult->generated_at?->toISOString(),
            'updated_at'      => $this->scoutReminderResult->updated_at->toISOString(),
        ];
    }
}
