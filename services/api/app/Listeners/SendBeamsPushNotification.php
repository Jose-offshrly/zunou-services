<?php

namespace App\Listeners;

use App\Enums\PulseCategory;
use App\Events\DirectMessageSent;
use App\Events\TeamMessageSent;
use App\Facades\Beams;
use App\Models\DirectMessageThread;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\Log;

/**
 * Sends Pusher Beams push notifications (FCM-only) when a chat message is sent.
 *
 * Handles TeamMessageSent and DirectMessageSent events.
 * NOT registered for ReplyTeamMessageSent because CreateTeamMessageAction
 * already fires TeamMessageSent for every message (including replies),
 * which would cause duplicate pushes.
 *
 * Targets only Android via FCM to avoid duplicate iOS notifications.
 */
class SendBeamsPushNotification implements ShouldQueue
{
    /**
     * Max message body length for push notification preview.
     */
    private const MAX_BODY_LENGTH = 200;

    /**
     * Pusher Beams publishToUsers limit per call.
     */
    private const BEAMS_USER_BATCH_SIZE = 1000;

    /**
     * Handle incoming events and dispatch the appropriate push notification.
     */
    public function handle(TeamMessageSent|DirectMessageSent $event): void
    {
        if (! Beams::isEnabled()) {
            return;
        }

        try {
            if ($event instanceof DirectMessageSent) {
                $this->handleDirectMessage($event);
            } else {
                $this->handleTeamMessage($event);
            }
        } catch (\Throwable $e) {
            // Never let a push notification failure break the messaging flow
            Log::error('SendBeamsPushNotification: failed to send push', [
                'event' => get_class($event),
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
        }
    }

    /**
     * Send push notification for a team message (including replies and ONETOONE DMs).
     */
    private function handleTeamMessage(TeamMessageSent $event): void
    {
        $teamMessage = $event->teamMessage;
        $teamMessage->loadMissing(['user', 'teamThread.pulse.members']);

        $teamThread = $teamMessage->teamThread;
        $pulse = $teamThread?->pulse;

        if (! $pulse) {
            Log::warning('SendBeamsPushNotification: pulse not found for team message', [
                'team_message_id' => $teamMessage->id,
                'team_thread_id'  => $teamMessage->team_thread_id,
            ]);
            return;
        }

        $senderId = $teamMessage->user_id;
        $senderName = $teamMessage->user?->name ?? 'Someone';

        // Get all pulse member user IDs except the sender
        $recipientIds = $pulse->members
            ->pluck('user_id')
            ->reject(fn ($userId) => $userId === $senderId)
            ->values()
            ->map(fn ($id) => (string) $id)
            ->toArray();

        if (empty($recipientIds)) {
            return;
        }

        // Build title based on pulse category (ONETOONE shows sender only, TEAM shows "sender in pulse")
        $pulseCategory = $pulse->category;
        $pulseName = $pulse->name;

        if ($pulseCategory === PulseCategory::ONETOONE || $pulseCategory === PulseCategory::PERSONAL) {
            $title = $senderName;
        } else {
            $title = "{$senderName} in {$pulseName}";
        }

        // Extract human-readable message preview from Slate.js or plain content
        $body = $this->extractMessagePreview($teamMessage->content);

        $payload = $this->buildFcmPayload($title, $body, [
            'type'          => 'team_message',
            'messageId'     => (string) $teamMessage->id,
            'pulseId'       => (string) $pulse->id,
            'teamThreadId'  => (string) $teamThread->id,
            'senderId'      => (string) $senderId,
        ]);

        $this->publishToUsers($recipientIds, $payload);
    }

    /**
     * Send push notification for a legacy direct message.
     */
    private function handleDirectMessage(DirectMessageSent $event): void
    {
        $directMessage = $event->directMessage;
        $directMessage->loadMissing('sender');

        $thread = DirectMessageThread::find($directMessage->direct_message_thread_id);

        if (! $thread) {
            Log::warning('SendBeamsPushNotification: DM thread not found', [
                'direct_message_id' => $directMessage->id,
                'thread_id'         => $directMessage->direct_message_thread_id,
            ]);
            return;
        }

        $senderId = $directMessage->sender_id;
        $senderName = $directMessage->sender?->name ?? 'Someone';

        // Get all thread participants except the sender
        $recipientIds = collect($thread->participants)
            ->reject(fn ($id) => $id === $senderId)
            ->values()
            ->map(fn ($id) => (string) $id)
            ->toArray();

        if (empty($recipientIds)) {
            return;
        }

        $title = $senderName;
        $body = $this->extractMessagePreview($directMessage->content);

        $payload = $this->buildFcmPayload($title, $body, [
            'type'     => 'direct_message',
            'threadId' => (string) $thread->id,
            'senderId' => (string) $senderId,
        ]);

        $this->publishToUsers($recipientIds, $payload);
    }

    /**
     * Build an FCM-only Beams payload. No APNs to avoid duplicate iOS notifications.
     */
    private function buildFcmPayload(string $title, string $body, array $data = []): array
    {
        return [
            'fcm' => [
                'notification' => [
                    'title' => $title,
                    'body'  => $body,
                ],
                'data' => $data,
            ],
        ];
    }

    /**
     * Publish to Beams, batching if there are more than BEAMS_USER_BATCH_SIZE recipients.
     */
    private function publishToUsers(array $recipientIds, array $payload): void
    {
        $batches = array_chunk($recipientIds, self::BEAMS_USER_BATCH_SIZE);

        foreach ($batches as $batch) {
            Beams::publishToUsers($batch, $payload);
        }
    }

    /**
     * Extract a short, human-readable preview from message content.
     *
     * Handles Slate.js arrays, JSON strings, and plain text.
     */
    private function extractMessagePreview(mixed $content): string
    {
        $text = $this->extractPlainText($content);

        // Strip basic markdown formatting
        $text = preg_replace('/\*\*(.*?)\*\*/u', '$1', $text) ?? $text;
        $text = preg_replace('/\*(.*?)\*/u', '$1', $text) ?? $text;
        $text = preg_replace('/_(.*?)_/u', '$1', $text) ?? $text;

        // Collapse whitespace
        $text = preg_replace('/\s+/u', ' ', $text) ?? $text;
        $text = trim($text);

        if ($text === '') {
            return 'Sent a message';
        }

        // Truncate to max length
        if (mb_strlen($text) > self::MAX_BODY_LENGTH) {
            $text = mb_substr($text, 0, self::MAX_BODY_LENGTH - 1) . '…';
        }

        return $text;
    }

    /**
     * Recursively extract plain text from Slate.js content or other formats.
     */
    private function extractPlainText(mixed $content): string
    {
        // Handle arrays (Slate.js nodes or structured content)
        if (is_array($content)) {
            if (isset($content['message']) && is_string($content['message'])) {
                return $content['message'];
            }

            return $this->extractTextFromNodes($content);
        }

        // Handle JSON strings
        if (is_string($content)) {
            $trimmed = trim($content);
            if (str_starts_with($trimmed, '{') || str_starts_with($trimmed, '[')) {
                try {
                    $decoded = json_decode($trimmed, true, 512, JSON_THROW_ON_ERROR);

                    if (is_array($decoded) && isset($decoded['message']) && is_string($decoded['message'])) {
                        return $decoded['message'];
                    }

                    if (is_array($decoded)) {
                        return $this->extractTextFromNodes($decoded);
                    }
                } catch (\Throwable) {
                    // Not valid JSON, treat as plain text
                }
            }

            return $trimmed;
        }

        return '';
    }

    /**
     * Recursively extract text from Slate.js node array.
     */
    private function extractTextFromNodes(array $nodes): string
    {
        $parts = [];

        foreach ($nodes as $node) {
            if (! is_array($node)) {
                continue;
            }

            // Leaf text node
            if (isset($node['text']) && is_string($node['text'])) {
                $parts[] = $node['text'];
                continue;
            }

            // Mention node -- render as "@name"
            if (isset($node['type']) && $node['type'] === 'mention') {
                $parts[] = '@' . ($node['mention']['name'] ?? 'user');
                continue;
            }

            // Recurse into children
            if (isset($node['children']) && is_array($node['children'])) {
                $childText = $this->extractTextFromNodes($node['children']);
                if ($childText !== '') {
                    $parts[] = $childText;
                }
            }
        }

        return implode('', $parts);
    }
}
