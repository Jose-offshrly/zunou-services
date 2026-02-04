<?php

namespace App\GraphQL\Mutations;

use App\Models\Notification;
use App\Models\Pulse;
use App\Models\User;
use App\Services\NotificationService;
use App\Enums\NotificationType;
use App\Enums\UserPresence;
use GraphQL\Error\Error;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Auth;
use Exception;

final readonly class CreateNotificationMutation
{
    public function __construct(private NotificationService $notifications)
    {
    }

    public function __invoke(null $_, array $args): ?Notification
    {
        try {
            $this->validateInput($args['input']);
            $input = $args['input'];

            if (
                !empty($input['notifyPulseMembers']) &&
                $input['notifyPulseMembers'] === true
            ) {
                return $this->createPulseMemberNotifications(
                    $input['type'],
                    $input
                );
            }

            if (
                !empty($input['notifyActiveMembers']) &&
                $input['notifyActiveMembers'] === true
            ) {
                return $this->createActiveMemberNotifications(
                    $input['type'],
                    $input
                );
            }

            $notification = $this->notifications->createNotification(
                description: $input['description'],
                type: NotificationType::from($input['type']),
                notifiableId: $input['notifiableId'],
                summaryId: $input['summaryId'] ?? null,
                kind: $input['kind'] ?? null,
                pulseId: $input['pulseId'] ?? null,
                organizationId: $input['organizationId'] ?? null
            );

            return $notification->refresh();
        } catch (Exception $e) {
            throw new Error(
                'Failed to create a notification: ' . $e->getMessage()
            );
        }
    }

    private function validateInput(array $input): void
    {
        $validator = Validator::make($input, [
            'description' => 'required|string',
            'type' => 'required|string',
            'notifiableId' => 'nullable|string|min:36|max:36',
            'summaryId' => 'nullable|exists:summaries,id',
            'pulseId' => 'nullable|exists:pulses,id',
            'organizationId' => 'nullable|exists:organizations,id',
            'kind' => 'nullable|string',
            'notifyPulseMembers' => 'nullable|boolean',
            'notifyActiveMembers' => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            throw new Error($validator->errors()->first());
        }
    }

    private function createPulseMemberNotifications(
        string $type,
        array $input
    ): ?Notification {
        if (empty($input['pulseId'])) {
            throw new Error(
                'pulseId is required when notifyPulseMembers is true.'
            );
        }

        $pulseId = $input['pulseId'];
        $pulse = Pulse::findOrFail($pulseId);

        $senderId = Auth::id();

        $memberIds = $pulse
            ->members()
            ->pluck('user_id')
            ->filter(fn($id) => $id !== $senderId)
            ->values();

        $lastNotification = null;

        foreach ($memberIds as $userId) {
            $lastNotification = $this->notifications->createNotification(
                description: $input['description'],
                type: NotificationType::USERS,
                notifiableId: $userId,
                summaryId: $input['summaryId'] ?? null,
                kind: $input['kind'] ?? null,
                pulseId: $pulseId,
                organizationId: $input['organizationId'] ?? null
            );
        }

        return $lastNotification?->refresh();
    }

    private function createActiveMemberNotifications(
        string $type,
        array $input
    ): ?Notification {
        if (empty($input['pulseId'])) {
            throw new Error(
                'pulseId is required when notifyActiveMembers is true.'
            );
        }

        $pulseId = $input['pulseId'];
        $pulse = Pulse::findOrFail($pulseId);

        $senderId = Auth::id();

        // Start from pulse members, then filter by user presence and sender.
        $memberIds = $pulse->members()->pluck('user_id');

        // Filter users who are not offline/hiatus and are not the sender.
        $eligibleUserIds = User::whereIn('id', $memberIds)
            ->whereNotIn('presence', [UserPresence::offline])
            ->pluck('id')
            ->filter(fn($id) => $id !== $senderId)
            ->values();

        $lastNotification = null;

        foreach ($eligibleUserIds as $userId) {
            $lastNotification = $this->notifications->createNotification(
                description: $input['description'],
                type: NotificationType::USERS,
                notifiableId: $userId,
                summaryId: $input['summaryId'] ?? null,
                kind: $input['kind'] ?? null,
                pulseId: $pulseId,
                organizationId: $input['organizationId'] ?? null
            );
        }

        return $lastNotification?->refresh();
    }
}
