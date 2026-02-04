<?php

namespace App\Notifications;

use App\DataTransferObjects\ZunouNotificationData;
use App\Models\Organization;
use App\Models\Pulse;
use App\Notifications\Channels\ZunouNotificationChannel;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Notification;

class PulseNotification extends Notification
{
    use Queueable;

    protected $notifiableId;

    /**
     * Create a new notification instance.
     */
    public function __construct(
        public readonly string $description,
        public readonly string $kind,
        public readonly ?array $metadata = [],
        public readonly ?string $summary_id = null,
    ) {
    }

    public function via(object $notifiable): array
    {
        return [ZunouNotificationChannel::class, 'broadcast'];
    }

    public function toBroadcast($notifiable): BroadcastMessage
    {
        $this->notifiableId = $notifiable->id;

        $notification = $notifiable->notification ?? null;

        if (! $notification) {
            $notification = $notifiable->notifications()
                ->where('description', $this->description)
                ->where('kind', $this->kind)
                ->latest()
                ->first();
        }

        if (! $notification) {
            $notification = $notifiable->notifications()->latest()->first();
        }

        if ($notification) {
            return new BroadcastMessage($notification->toArray());
        }

        return new BroadcastMessage([
            'description'     => $this->description,
            'kind'            => $this->kind,
            'pulse_id'        => $notifiable->id,
            'organization_id' => $notifiable instanceof \App\Models\Organization
                ? $notifiable->id
                : $notifiable->organization_id,
            'status'     => 'pending',
            'metadata'   => $this->metadata ?? [],
            'summary_id' => $this->summary_id,
        ]);
    }

    public function broadcastOn(): array
    {
        return ['pulse-notification.'.$this->notifiableId];
    }

    public function broadcastAs(): string
    {
        return 'pulse-notification';
    }

    public function toDatabase(object $notifiable): ZunouNotificationData
    {
        return new ZunouNotificationData(
            description: $this->description,
            kind: $this->kind,
            organization_id: $notifiable instanceof Organization
                ? $notifiable->id
                : $notifiable->organization_id,
            metadata: $this->metadata ?? null,
            pulse_id: $notifiable instanceof Pulse ? $notifiable->id : null,
            summary_id: $this->summary_id ?? null,
        );
    }
}
