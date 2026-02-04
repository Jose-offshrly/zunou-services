<?php

namespace App\Actions\Assignee;

use App\Contracts\Assignable;
use App\Models\Assignee;
use App\Models\User;
use App\Enums\NotificationType;
use App\Enums\NotificationKind;
use App\Services\NotificationService;

final class CreateAssigneeAction
{
    public function __construct(private NotificationService $notifications) {}

    public function handle(Assignable $entity, User $user): Assignee
    {
        $assignee = $entity->assignees()->create([
            'user_id' => $user->id,
        ]);

        $this->notifications->createNotification(
            description: "You've been assigned to task $entity->title",
            type: NotificationType::USERS,
            notifiableId: $user->id,
            summaryId: null,
            kind: NotificationKind::assignee_created->value,
            pulseId: $entity->entity_id,
            taskId: $entity->id,
        );

        return $assignee->refresh();
    }
}
