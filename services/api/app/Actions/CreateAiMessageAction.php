<?php

namespace App\Actions;

use App\Enums\MessageStatus;
use App\Events\StartCompletionEvent;
use App\Models\Message;
use App\Models\Thread;
use App\Models\User;
use Illuminate\Support\Carbon;

class CreateAiMessageAction
{
    public static function execute(
        string $organizationId,
        Thread $thread,
        User $user,
        ?Carbon $created_at = null,
        ?string $topicId = null,
    ): Message {
        $ai_payload = [
            'content'         => '',
            'organization_id' => $organizationId,
            'role'            => 'assistant',
            'thread_id'       => $thread->id,
            'topic_id'        => $topicId,
            'user_id'         => $user->id,
            'status'          => MessageStatus::PENDING,
        ];

        // Explicitly set the created_at and updated_at value
        if ($created_at !== null) {
            return Message::withoutTimestamps(function () use (
                $ai_payload,
                $created_at,
                $organizationId,
                $thread,
                $user
            ) {
                $ai_payload['created_at'] = $created_at;
                $ai_payload['updated_at'] = $created_at;

                $ai_message = Message::create($ai_payload);

                StartCompletionEvent::dispatch(
                    $organizationId,
                    $thread,
                    $user,
                    $ai_message,
                );

                return $ai_message->refresh();
            });
        }

        // Normal creation with auto timestamps
        $ai_message = Message::create($ai_payload);

        StartCompletionEvent::dispatch(
            $organizationId,
            $thread,
            $user,
            $ai_message,
        );

        return $ai_message->refresh();
    }
}
