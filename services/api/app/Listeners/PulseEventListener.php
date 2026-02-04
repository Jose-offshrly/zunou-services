<?php

namespace App\Listeners;

use App\Enums\NotificationType;
use App\Events\PulseEventOccurred;
use app\Services\NotificationService;

class PulseEventListener
{
    protected $notificationService;

    public function __construct(NotificationService $notificationService)
    {
        $this->notificationService = $notificationService;
    }

    public function handle(PulseEventOccurred $event)
    {
        // Create a notification for the pulse
        $this->notificationService->createNotification(
            description: $event->description,
            type: NotificationType::PULSE,
            notifiableId: $event->pulse->id,
        );
    }
}
