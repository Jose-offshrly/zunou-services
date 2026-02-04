<?php

namespace App\Listeners;

use App\Enums\NotificationType;
use App\Events\OrganizationEventOccurred;
use App\Services\NotificationService;

class OrganizationEventListener
{
    protected NotificationService $notificationService;

    public function __construct(NotificationService $notificationService)
    {
        $this->notificationService = $notificationService;
    }

    public function handle(OrganizationEventOccurred $event)
    {
        // Create a notification for the organization
        $this->notificationService->createNotification(
            description: $event->description,
            type: NotificationType::ORGANIZATION,
            notifiableId: $event->organization->id,
        );
    }
}
