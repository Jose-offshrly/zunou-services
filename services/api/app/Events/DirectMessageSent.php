<?php

namespace App\Events;

use App\Models\DirectMessage;
use App\Models\DirectMessageThread;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Str;

/**
 * @deprecated Part of deprecated DirectMessage system. Use TeamMessageSent with ONETOONE pulse category instead.
 */
class DirectMessageSent implements ShouldBroadcast
{
    use Dispatchable;
    use InteractsWithSockets;
    use SerializesModels;

    public DirectMessage $directMessage;

    public function __construct(DirectMessage $directMessage)
    {
        $this->directMessage = $directMessage;
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
