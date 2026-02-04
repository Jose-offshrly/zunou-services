<?php

namespace App\Events;

use App\Facades\Beams;
use App\Models\TeamMessage;
use App\Models\TeamThread;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Str;

class TeamMessageSent implements ShouldBroadcast
{
    use Dispatchable;
    use InteractsWithSockets;
    use SerializesModels;

    public TeamMessage $teamMessage;

    public function __construct(TeamMessage $teamMessage)
    {
        $this->teamMessage = $teamMessage;

        $this->pushNotification();
    }

    public function broadcastOn(): array
    {
        $teamThread = TeamThread::find($this->teamMessage->team_thread_id);

        return [
            new PresenceChannel('team.thread.' . $teamThread->pulse_id),
            new PresenceChannel(
                'team-messages.' . $teamThread->organization_id
            ),
        ];
    }

    public function broadcastAs(): string
    {
        return 'team-message-sent';
    }

    public function broadcastWith(): array
    {
        $userName = $this->teamMessage->user->name;
        $teamThread = TeamThread::with('pulse.members.user')->find($this->teamMessage->team_thread_id);
        $pulseName = $teamThread->pulse?->name;
        $pulseCategory = $teamThread->pulse?->category;

        // Use unified message extraction for broadcasts
        $messageText = $this->extractMessageText($this->teamMessage->content);
        $sanitizedMessage = Str::sanitize($messageText);

        return [
            'messageId' => $this->teamMessage->id,
            'teamThreadId' => $teamThread->id,
            'topicId' => $this->teamMessage->topic_id,
            'userId' => $this->teamMessage->user_id,
            'organizationId' => $teamThread->organization_id,
            'pulseId' => $teamThread->pulse_id,
            'pulseName' => $pulseName,
            'name' => $userName,
            // Human-readable text
            'message' => $sanitizedMessage,
            // Preserve raw for rich clients
            'content' => $this->teamMessage->content,
            'replyTeamThreadId' => $this->teamMessage->reply_team_thread_id,
            'repliedToMessageId' => $this->teamMessage->replied_to_message_id,
            'metadata' => $this->teamMessage->metadata,
            'timestamp' => now()->toIso8601String(),
            'category' => $pulseCategory,
        ];
    }

    public function pushNotification(): string
    {
        try {
            // Check if Beams is enabled
            if (!Beams::isEnabled()) {
                \Log::warning(
                    'Pusher Beams is not enabled, skipping push notification'
                );
                return '';
            }

            // Use unified message extraction and normalization for push
            $userName = $this->teamMessage->user->name;
            $rawContent = $this->teamMessage->content;
            $messageText = $this->extractMessageText($rawContent);

            // For Pulse system messages, extract the `message` directly from raw content
            if ($this->teamMessage->is_from_pulse_chat) {
                $messageText =
                    $this->extractPulseMessage($rawContent) ?? $messageText;
            }

            $parsedBody = Str::sanitize($messageText);

            // Get all pulse members except the sender
            // Eager load members.user to prevent N+1 when accessing pulse->name for ONETOONE pulses
            $teamThread = $this->teamMessage->teamThread;

            // Check if pulse exists
            if (!$teamThread || !$teamThread->pulse) {
                \Log::warning(
                    'Team thread or pulse not found, skipping push notification',
                    [
                        'team_thread_id' => $this->teamMessage->team_thread_id,
                    ]
                );
                return '';
            }

            // Eager load members.user if not already loaded to prevent N+1 on pulse->name
            if (!$teamThread->pulse->relationLoaded('members')) {
                $teamThread->pulse->load('members.user');
            }

            // Cache pulse name and other values to avoid repeated accessor calls
            $pulse = $teamThread->pulse;
            $pulseName = $pulse->name ?? 'Team';
            $pulseIcon = $pulse->icon;
            $pulseCategory = $pulse->category;

            // Use preloaded members collection (without parentheses) to avoid extra query
            $pulseMembers = $pulse->members
                ->where('user_id', '!=', $this->teamMessage->user_id)
                ->pluck('user_id')
                ->toArray();

            // Check if there are any recipients
            if (empty($pulseMembers)) {
                \Log::info(
                    'No pulse members to notify, skipping push notification',
                    [
                        'team_thread_id' => $this->teamMessage->team_thread_id,
                        'pulse_id' => $pulse->id,
                    ]
                );
                return '';
            }

            // Build grouping identifiers
            $threadGroupId = 'team-thread-' . $teamThread->id;
            $messageTag = $threadGroupId . '-msg-' . $this->teamMessage->id;

            // Build payload data structure
            $payloadData = [
                'message_type' => $pulseCategory ?? 'team-message',
                'thread_id' => (string) $teamThread->id,
                'message_id' => (string) $this->teamMessage->id,
                'is_mention' => $this->hasMentions($this->teamMessage->content),
                'sender' => [
                    'id' => (string) $this->teamMessage->user_id,
                    'name' => $userName,
                    'gravatar' => $this->teamMessage->user->gravatar,
                ],
                'org' => [
                    'id' => (string) $teamThread->organization_id,
                    'name' => $teamThread->organization->name,
                    'logo' => $teamThread->organization->logo,
                ],
                'pulse' => [
                    'id' => (string) $teamThread->pulse_id,
                    'name' => $pulseName,
                    'logo' => $pulseIcon,
                ],
            ];

            $notificationTitle = $userName . ' in ' . $pulseName;

            $publishId = Beams::publishToUsers($pulseMembers, [
                'fcm' => [
                    'notification' => [
                        'title' => $notificationTitle,
                        'body' => $parsedBody,
                        'sound' => 'default',
                        'tag' => $messageTag,
                    ],
                    'android' => [
                        'group' => $threadGroupId,
                        'notification' => [
                            'icon' => $pulseIcon ?? config('zunou.app.logo'),
                            'channel_id' => 'team_messages',
                            'priority' => 'high',
                            'tag' => $messageTag,
                        ],
                    ],
                    'data' => [
                        'payload' => json_encode(
                            $payloadData,
                            JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE
                        ),
                        'thread_id' => (string) $teamThread->id,
                        'message_id' => (string) $this->teamMessage->id,
                        'collapse_key' => $threadGroupId,
                    ],
                ],
                'apns' => [
                    'headers' => [
                        'apns-collapse-id' => $threadGroupId,
                    ],
                    'aps' => [
                        'alert' => [
                            'title' => $notificationTitle,
                            'body' => $parsedBody,
                        ],
                        'sound' => 'default',
                        'badge' => 1,
                        'mutable-content' => 1,
                        'content-available' => 1,
                        'thread-id' => $threadGroupId,
                    ],
                    'data' => [
                        'payload' => json_encode(
                            $payloadData,
                            JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE
                        ),
                    ],
                ],
                'web' => [
                    'notification' => [
                        'title' => $notificationTitle,
                        'body' => $parsedBody,
                        'icon' => config('zunou.app.logo'),
                        'sound' => 'default',
                        'tag' => $threadGroupId,
                    ],
                    'data' => [
                        'payload' => json_encode(
                            $payloadData,
                            JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE
                        ),
                    ],
                ],
            ]);

            \Log::info('Push notification sent successfully', [
                'publish_id' => $publishId,
                'recipients_count' => count($pulseMembers),
                'message_id' => $this->teamMessage->id,
                'thread_group_id' => $threadGroupId,
            ]);

            return $publishId;
        } catch (\Exception $e) {
            \Log::error('Failed to send push notification', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'message_id' => $this->teamMessage->id,
            ]);
            return '';
        }
    }

    /**
     * Extract the message field from Pulse system message content.
     * Returns null if extraction fails, allowing fallback to extractMessageText.
     */
    private function extractPulseMessage(mixed $rawContent): ?string
    {
        if (is_array($rawContent)) {
            if (
                isset($rawContent['message']) &&
                is_string($rawContent['message'])
            ) {
                return $rawContent['message'];
            }
            return null;
        }

        if (is_string($rawContent)) {
            $trimmed = trim($rawContent);
            if (Str::startsWith($trimmed, ['{', '['])) {
                try {
                    $decoded = json_decode(
                        $trimmed,
                        true,
                        512,
                        JSON_THROW_ON_ERROR
                    );
                    if (
                        is_array($decoded) &&
                        isset($decoded['message']) &&
                        is_string($decoded['message'])
                    ) {
                        return $decoded['message'];
                    }
                } catch (\Throwable) {
                    // Return null to fall back to extractMessageText
                }
            }
        }

        return null;
    }

    /**
     * Extract a readable message string from mixed content (array, JSON string, plain string).
     */
    private function extractMessageText(mixed $rawContent): string
    {
        if (is_array($rawContent)) {
            // Check for message field first (for structured messages like meeting summaries)
            if (
                isset($rawContent['message']) &&
                is_string($rawContent['message'])
            ) {
                return $rawContent['message'];
            }

            // Check if this is a Slate.js array (array of nodes with children or type properties)
            if ($this->isSlateArray($rawContent)) {
                return $this->extractTextFromSlateArray($rawContent);
            }

            // Fallback to JSON encoding for other array types
            return json_encode(
                $rawContent,
                JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE
            ) ?:
                '';
        }

        if (is_string($rawContent)) {
            $trimmed = trim($rawContent);
            if (Str::startsWith($trimmed, ['{', '['])) {
                try {
                    $decoded = json_decode(
                        $trimmed,
                        true,
                        512,
                        JSON_THROW_ON_ERROR
                    );
                    if (
                        is_array($decoded) &&
                        isset($decoded['message']) &&
                        is_string($decoded['message'])
                    ) {
                        return $decoded['message'];
                    }
                    // Check if decoded content is a Slate.js array
                    if ($this->isSlateArray($decoded)) {
                        return $this->extractTextFromSlateArray($decoded);
                    }
                    return $trimmed;
                } catch (\Throwable) {
                    return $trimmed;
                }
            }
            return $trimmed;
        }

        try {
            return (string) $rawContent;
        } catch (\Throwable) {
            return '';
        }
    }

    /**
     * Check if an array is a Slate.js content array.
     * Slate.js arrays contain objects with 'children' or 'type' properties.
     */
    private function isSlateArray(mixed $value): bool
    {
        if (!is_array($value) || empty($value)) {
            return false;
        }

        // Check if first element looks like a Slate.js node
        $firstElement = $value[0] ?? null;
        if (!is_array($firstElement)) {
            return false;
        }

        // Slate.js nodes typically have 'children' or 'type' properties
        return isset($firstElement['children']) || isset($firstElement['type']);
    }

    /**
     * Extract plain text from Slate.js content array by recursively traversing nodes.
     * Preserves mentions as "@{name}" format.
     */
    private function extractTextFromSlateArray(array $nodes): string
    {
        $textParts = [];

        foreach ($nodes as $node) {
            if (!is_array($node)) {
                continue;
            }

            // Leaf text node - has 'text' property but no 'type' or 'children'
            // This handles standalone text nodes
            if (
                isset($node['text']) &&
                is_string($node['text']) &&
                !isset($node['type']) &&
                !isset($node['children'])
            ) {
                $textParts[] = $node['text'];
                continue;
            }

            // Mention node - preserve as "@{name}"
            if (isset($node['type']) && $node['type'] === 'mention') {
                if (isset($node['mention']['name'])) {
                    $textParts[] = '@' . $node['mention']['name'];
                } elseif (isset($node['children'])) {
                    // Fallback: extract text from children if mention name not available
                    $textParts[] = $this->extractTextFromSlateArray(
                        $node['children']
                    );
                }
                continue;
            }

            // Link node - extract text from children (don't include URL)
            if (isset($node['type']) && $node['type'] === 'link') {
                if (isset($node['children'])) {
                    $textParts[] = $this->extractTextFromSlateArray(
                        $node['children']
                    );
                }
                continue;
            }

            // Element nodes with children (paragraph, etc.) - extract from children
            if (isset($node['children']) && is_array($node['children'])) {
                $childText = $this->extractTextFromSlateArray(
                    $node['children']
                );
                if (!empty($childText)) {
                    $textParts[] = $childText;
                }
                continue;
            }

            // Fallback: if node has text property but we haven't handled it yet
            if (isset($node['text']) && is_string($node['text'])) {
                $textParts[] = $node['text'];
            }
        }

        return implode('', $textParts);
    }

    /**
     * Check if message content contains mentions.
     */
    private function hasMentions(mixed $rawContent): bool
    {
        if (is_array($rawContent)) {
            if ($this->isSlateArray($rawContent) && $this->hasMentionsInSlateArray($rawContent)) {
                return true;
            }
        }

        if (is_string($rawContent)) {
            $trimmed = trim($rawContent);
            if (Str::startsWith($trimmed, ['{', '['])) {
                try {
                    $decoded = json_decode($trimmed, true, 512, JSON_THROW_ON_ERROR);
                    if (is_array($decoded) && $this->isSlateArray($decoded) && $this->hasMentionsInSlateArray($decoded)) {
                        return true;
                    }
                } catch (\Throwable) {
                    // ignore and fall through
                }
            }
        }

        return false;
    }

    /**
     * Recursively check Slate.js array for mention nodes.
     */
    private function hasMentionsInSlateArray(array $nodes): bool
    {
        foreach ($nodes as $node) {
            if (!is_array($node)) {
                continue;
            }

            if (isset($node['type']) && $node['type'] === 'mention') {
                return true;
            }

            if (isset($node['children']) && is_array($node['children'])) {
                if ($this->hasMentionsInSlateArray($node['children'])) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Normalize text for push notifications: remove basic markdown, collapse whitespace, cap length.
     */
    private function normalizeForPush(string $text): string
    {
        $clean = $text;
        $clean = preg_replace('/\*\*(.*?)\*\*/u', '$1', $clean ?? '') ?? '';
        $clean = preg_replace('/\*(.*?)\*/u', '$1', $clean) ?? $clean;
        $clean = preg_replace('/_(.*?)_/u', '$1', $clean) ?? $clean;
        $clean = preg_replace('/\s{3,}/u', '  ', $clean) ?? $clean;

        if (function_exists('mb_strlen') && function_exists('mb_substr')) {
            if (mb_strlen($clean) > 800) {
                $clean = mb_substr($clean, 0, 797) . '…';
            }
        } else {
            if (strlen($clean) > 800) {
                $clean = substr($clean, 0, 797) . '…';
            }
        }

        return $clean;
    }
}
