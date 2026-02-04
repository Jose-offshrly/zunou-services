<?php

namespace App\Notifications;

use App\Models\MeetingSession;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class CompanionStatusNotification extends Notification
{
    use Queueable;

    public function __construct(
        public MeetingSession $meetingSession,
        public array $data,
    ) {
    }

    public function via(object $notifiable): array
    {
        return ['broadcast'];
    }

    public function toBroadcast(object $notifiable): array
    {
        return [
            'message'        => 'Companion status has been updated.',
            'data'           => $this->data,
            'meetingSession' => $this->meetingSession,
        ];
    }
}
