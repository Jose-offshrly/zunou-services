<?php

namespace App\Events;

use App\Facades\Beams;
use App\Models\DirectMessage;
use App\Models\DirectMessageThread;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Str;

class DirectMessageSent implements ShouldBroadcast
{
    use Dispatchable;
    use InteractsWithSockets;
    use SerializesModels;

    public DirectMessage $directMessage;

    public function __construct(DirectMessage $directMessage)
    {
        $this->directMessage = $directMessage;

        $this->pushNotification();
    }

    public function broadcastOn(): array
    {
        $thread = DirectMessageThread::find(
            $this->directMessage->direct_message_thread_id
        );
        $participantsIds = $thread->participants;

        $channels = [new PresenceChannel('direct.thread.' . $thread->id)];
        foreach ($participantsIds as $participantId) {
            $channels[] = new Channel('direct-messages.' . $participantId);
        }

        return $channels;
    }

    public function broadcastAs(): string
    {
        return 'direct-message-sent';
    }

    public function broadcastWith(): array
    {
        $thread = DirectMessageThread::find(
            $this->directMessage->direct_message_thread_id
        );

        $participants = $thread->participants;
        $receiverId = collect($participants)->firstWhere(
            fn($id) => $id !== $this->directMessage->sender_id
        );

        // Use unified extraction and sanitization for broadcasts
        $messageText = $this->extractMessageText($this->directMessage->content);
        $sanitizedMessage = Str::sanitize($messageText);

        return [
            'senderName' => $this->directMessage->sender->name,
            'senderId' => $this->directMessage->sender_id,
            'receiverId' => $receiverId,
            // Human-readable text
            'message' => $sanitizedMessage,
            // Preserve raw content for rich clients
            'content' => $this->directMessage->content,
            'threadId' => $thread->id,
            'organizationId' => $thread->organization_id,
            'timestamp' => now()->toIso8601String(),
        ];
    }

    public function pushNotification(): string
    {
        try {
            // Check if Beams is enabled
            if (!Beams::isEnabled()) {
                \Log::warning('Pusher Beams is not enabled, skipping push notification');
                return '';
            }

            // Get the other participant (not the sender)
            $thread = $this->directMessage->thread;
            
            if (!$thread) {
                \Log::warning('Direct message thread not found, skipping push notification', [
                    'direct_message_id' => $this->directMessage->id,
                ]);
                return '';
            }

            $participants = $thread->participants;
            $receiverId = collect($participants)->firstWhere(
                fn($id) => $id !== $this->directMessage->sender_id
            );

            // Check if receiver exists
            if (!$receiverId) {
                \Log::info('No receiver found for direct message, skipping push notification', [
                    'direct_message_id' => $this->directMessage->id,
                    'sender_id' => $this->directMessage->sender_id,
                    'thread_id' => $thread->id,
                ]);
                return '';
            }

            // Use unified message extraction (reuse existing method)
            $messageText = $this->extractMessageText($this->directMessage->content);
            $parsedBody = Str::sanitize($messageText);

            // Build grouping identifiers
            $threadGroupId = 'dm-thread-' . $this->directMessage->direct_message_thread_id;
            $messageTag = $threadGroupId . '-msg-' . $this->directMessage->id;
        
            // Build payload data structure
            $payloadData = [
                'message_type' => 'direct-message',
                'thread_id' => (string) $this->directMessage->direct_message_thread_id,
                'message_id' => (string) $this->directMessage->id,
                'is_mention' => $this->hasMentions($this->directMessage->content),
                'sender' => [
                    'id' => (string) $this->directMessage->sender_id,
                    'name' => $this->directMessage->sender->name,
                    'gravatar' => $this->directMessage->sender->gravatar,
                ],
                'org' => [
                    'id' => (string) $this->directMessage->thread->organization_id,
                    'name' => $this->directMessage->thread->organization->name,
                    'logo' => $this->directMessage->thread->organization->logo,
                ],
                'receiver' => [
                    'id' => (string) $this->directMessage->thread->otherParticipant->id,
                    'name' => $this->directMessage->thread->otherParticipant->name,
                    'gravatar' => $this->directMessage->thread->otherParticipant->gravatar,
                ],
            ];

            $senderName = $this->directMessage->sender->name ?? 'Unknown User';

            $publishId = Beams::publishToUsers(
                [$receiverId],
                [
                    'fcm' => [
                        'notification' => [
                            'title' => $senderName,
                            'body' => $parsedBody,
                            'sound' => 'default',
                            'tag' => $messageTag,
                        ],
                        'android' => [
                            'group' => $threadGroupId,
                            'notification' => [
                                'icon' => config('zunou.app.logo'),
                                'channel_id' => 'direct_messages',
                                'priority' => 'high',
                                'tag' => $messageTag,
                            ],
                        ],
                        'data' => [
                            'payload' => json_encode(
                                $payloadData,
                                JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE
                            ),
                            'thread_id' => (string) $this->directMessage->direct_message_thread_id,
                            'message_id' => (string) $this->directMessage->id,
                            'collapse_key' => $threadGroupId,
                        ],
                    ],
                    'apns' => [
                        'headers' => [
                            'apns-collapse-id' => $threadGroupId,
                        ],
                        'aps' => [
                            'alert' => [
                                'title' => $senderName,
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
                            'title' => $senderName,
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
                ]
            );

            \Log::info('Push notification sent successfully', [
                'publish_id' => $publishId,
                'receiver_id' => $receiverId,
                'message_id' => $this->directMessage->id,
                'thread_group_id' => $threadGroupId,
            ]);

            return $publishId;
        } catch (\Exception $e) {
            \Log::error('Failed to send push notification', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'message_id' => $this->directMessage->id,
            ]);
            return '';
        }
    }

    /**
     * Check if an array is a Slate.js content array.
     */
    private function isSlateArray(mixed $value): bool
    {
        if (!is_array($value) || empty($value)) {
            return false;
        }

        $firstElement = $value[0] ?? null;
        if (!is_array($firstElement)) {
            return false;
        }

        return isset($firstElement['children']) || isset($firstElement['type']);
    }

    /**
     * Extract a readable message string from mixed content (array, JSON string, plain string).
     */
    private function extractMessageText(mixed $rawContent): string
    {
        if (is_array($rawContent)) {
            if (
                isset($rawContent['message']) &&
                is_string($rawContent['message'])
            ) {
                return $rawContent['message'];
            }
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
}
