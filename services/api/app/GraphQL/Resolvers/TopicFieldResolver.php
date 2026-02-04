<?php

declare(strict_types=1);

namespace App\GraphQL\Resolvers;

use App\Models\LiveInsightOutbox;
use App\Models\Message;
use App\Models\TeamMessage;
use App\Models\TeamThread;
use App\Models\Thread;
use App\Models\Topic;

final class TopicFieldResolver
{
    public function teamThread(Topic $topic): ?TeamThread
    {
        if ($topic->entity_type === TeamThread::class && $topic->entity_id) {
            // Use preloaded relation if available, otherwise query
            if ($topic->relationLoaded('entity') && $topic->entity instanceof TeamThread) {
                return $topic->entity;
            }
            return TeamThread::find($topic->entity_id);
        }

        return null;
    }

    public function thread(Topic $topic)
    {
        if ($topic->entity_type === Thread::class && $topic->entity_id) {
            if ($topic->relationLoaded('entity') && $topic->entity instanceof Thread) {
                return $topic->entity;
            }
            return Thread::find($topic->entity_id);
        }

        // Fallback to TeamThread for backward compatibility
        return $this->teamThread($topic);
    }

    /**
     * Resolve messages belonging to this topic's thread.
     */
    public function messages(Topic $topic)
    {
        if ($topic->entity_type === Thread::class && $topic->entity_id) {
            // Use preloaded entity and messages if available to avoid N+1
            if ($topic->relationLoaded('entity') && $topic->entity instanceof Thread) {
                if ($topic->entity->relationLoaded('messages')) {
                    return $topic->entity->messages->sortBy('created_at')->values();
                }
            }

            // Fallback to query if not preloaded
            return Message::where('thread_id', $topic->entity_id)
                ->orderBy('created_at', 'asc')
                ->get();
        }

        // Return empty collection for other entity types
        return collect();
    }

    /**
     * Resolve insight reference specifically (when reference_type is LiveInsightOutbox).
     * Uses the morphTo relationship to resolve the reference.
     */
    public function insight(Topic $topic): ?LiveInsightOutbox
    {
        if (!$topic->reference_type || !$topic->reference_id) {
            return null;
        }

        // Use the morphTo relationship - it will return null if type doesn't match
        $reference = $topic->reference;

        return $reference instanceof LiveInsightOutbox ? $reference : null;
    }
}
