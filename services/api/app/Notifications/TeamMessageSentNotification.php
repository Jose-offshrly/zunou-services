<?php

namespace App\Notifications;

use App\Events\TeamMessageSent;
use App\Models\TeamMessage;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;
use NotificationChannels\WebPush\WebPushChannel;
use NotificationChannels\WebPush\WebPushMessage;

class TeamMessageSentNotification extends Notification implements ShouldQueue
{
    use Queueable;

    /**
     * Create a new notification instance.
     */
    public function __construct(public TeamMessage $teamMessage)
    {
        //
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        TeamMessageSent::dispatch($this->teamMessage->refresh());

        return [WebPushChannel::class];
    }

    public function toWebPush($notifiable, $notification)
    {
        return (new WebPushMessage())
            ->title('New TeamMessage!')
            ->body('You’ve got a new team message')
            ->icon('/icon.png')
            ->action('View', 'open_app');
    }
}
