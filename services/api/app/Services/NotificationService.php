<?php

namespace App\Services;

use App\Enums\NotificationType;
use App\Events\NotificationProcessed;
use App\Models\Notification;
use App\Models\NotificationContext;
use App\Models\Organization;
use App\Models\Pulse;
use Illuminate\Support\Facades\DB;
use App\Notifications\PulseNotification;
use App\Notifications\OrganizationNotification;
use Exception;

class NotificationService
{
    public function createNotification(
        string $description,
        NotificationType $type,
        string $notifiableId,
        ?string $summaryId = null,
        ?string $kind = null,
        ?string $pulseId = null,
        ?string $taskId = null,
        ?string $organizationId = null,
    ): Notification {
        return DB::transaction(function () use (
            $description,
            $type,
            $notifiableId,
            $summaryId,
            $kind,
            $pulseId,
            $taskId,
            $organizationId,
        ) {
            switch ($type) {
                case NotificationType::ORGANIZATION:
                    return $this->createOrganizationNotification($description, $notifiableId, $kind);

                case NotificationType::PULSE:
                    return $this->createPulseNotification($description, $notifiableId, $kind, $summaryId);

                case NotificationType::USERS:
                    return $this->createUserNotification($description, $notifiableId, $kind, $pulseId, $summaryId, $taskId, $organizationId);

                default:
                    throw new Exception("Unsupported notification type: {$type->value}");
            }
        });
    }

    private function createOrganizationNotification(string $description, string $organizationId, ?string $kind): Notification
    {
        $organization = Organization::findOrFail($organizationId);

        // Check if a notification with the same description already exists for this organization
        // Use lockForUpdate to prevent race conditions
        $existingNotification = Notification::where('description', $description)
            ->where('organization_id', $organizationId)
            ->where('status', 'pending')
            ->lockForUpdate()
            ->first();

        // If a duplicate exists and is pending, return the existing one
        if ($existingNotification) {
            return $existingNotification;
        }

        $organization->notify(
            new OrganizationNotification(
                description: $description,
                kind: $kind ?? 'information',
            )
        );

        return $organization->notifications()->latest()->first();
    }

    private function createPulseNotification(
        string $description,
        string $pulseId,
        ?string $kind,
        ?string $summaryId,
    ): Notification {
        $pulse = Pulse::findOrFail($pulseId);

        // Check if a notification with the same description already exists for this organization
        // Use lockForUpdate to prevent race conditions
        if ($pulse->organization_id) {
            $existingNotification = Notification::where('description', $description)
                ->where('organization_id', $pulse->organization_id)
                ->where('status', 'pending')
                ->lockForUpdate()
                ->first();

            // If a duplicate exists and is pending, return the existing one
            if ($existingNotification) {
                return $existingNotification;
            }
        }

        $pulse->notify(
            new PulseNotification(
                description: $description,
                kind: $kind,
                summary_id: $summaryId
            )
        );

        return $pulse->notifications()->latest()->first();
    }

    private function createUserNotification(
        string $description,
        string $userId,
        ?string $kind,
        ?string $pulseId,
        ?string $summaryId,
        ?string $taskId,
        ?string $organizationId = null,
    ): Notification {
        $pulse = $pulseId ? Pulse::find($pulseId) : null;

        // Use provided organization ID or fall back to pulse's organization
        $finalOrganizationId = $organizationId ?? $pulse?->organization_id;
        $organization = $finalOrganizationId ? Organization::find($finalOrganizationId) : null;

        // Check if a duplicate notification already exists
        // Match on description and organization only (ignore pulse_id)
        // Only check for duplicates if we have an organization_id
        // Use lockForUpdate to prevent race conditions
        $existingNotification = null;
        if ($finalOrganizationId) {
            $existingNotification = Notification::where('description', $description)
                ->where('organization_id', $finalOrganizationId)
                ->where('status', 'pending')
                ->lockForUpdate()
                ->first();
        }

        // If a duplicate exists and is pending, return the existing one
        if ($existingNotification) {
            // Attach user if not already attached
            if (!$existingNotification->users()->where('users.id', $userId)->exists()) {
                $existingNotification->users()->attach($userId);
            }
            return $existingNotification;
        }

        $notification = Notification::create([
            'description'       => $description,
            'kind'              => $kind,
            'status'            => 'pending',
            'pulse_id'          => $pulse?->id,
            'organization_id'   => $finalOrganizationId,
        ]);

        if ($taskId !== null) {
            NotificationContext::create([
                'notification_id' => $notification->id,
                'task_id'         => $taskId,
                'is_archived'     => false,
            ]);
        }

        if ($summaryId !== null) {
            $notificationContext = NotificationContext::create([
                'notification_id' => $notification->id,
                'summary_id'      => $summaryId,
            ]);

            event(new NotificationProcessed($notificationContext, $userId));
        }

        $notification->users()->attach($userId);

        if ($pulse) {
            $pulse->notify(new PulseNotification(
                description: $description,
                kind: $kind,
            ));
        }

        // Notify the organization using fallback (explicit organizationId or pulse's organization)
        if ($organization) {
            $organization->notify(new OrganizationNotification(
                description: $description,
                kind: $kind ?? 'information',
            ));
        }

        return $notification;
    }
}
