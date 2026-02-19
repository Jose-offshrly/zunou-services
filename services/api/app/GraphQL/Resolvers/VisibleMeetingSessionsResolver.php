<?php

namespace App\GraphQL\Resolvers;

use App\Models\Event;
use App\Models\MeetingSession;
use Illuminate\Support\Collection;
use Nuwave\Lighthouse\Execution\ResolveInfo;
use Nuwave\Lighthouse\Support\Contracts\GraphQLContext;

/**
 * Resolver for Event.visibleMeetingSessions field.
 *
 * Returns all MeetingSessions that the current user can access for this event
 * and any related events with the same google_event_id (i.e., duplicate calendar
 * events synced to different users/pulses).
 */
readonly class VisibleMeetingSessionsResolver
{
    /**
     * @param  Event  $event  The parent Event model
     * @param  array<string, mixed>  $args
     * @return Collection<MeetingSession>
     */
    public function __invoke(
        Event $event,
        array $args,
        GraphQLContext $context,
        ResolveInfo $resolveInfo
    ): Collection {
        $user = $context->user();

        if (! $user) {
            return collect();
        }

        return $event->getVisibleMeetingSessions($user);
    }
}
