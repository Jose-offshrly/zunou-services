<?php

declare(strict_types=1);

namespace App\GraphQL\Resolvers;

use App\Models\Event;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;
use Nuwave\Lighthouse\Execution\ResolveInfo;

final class VisibleEventInstancesResolver
{
    /**
     * Resolve visible event instances for an event.
     * Returns all EventInstances the current user can access that relate to the same calendar event
     * (identified by google_event_id), filtered by the user's pulse memberships.
     *
     * @param  Event  $event  The parent event
     * @param  array  $args  GraphQL arguments
     * @param  mixed  $context  GraphQL context
     * @param  ResolveInfo  $resolveInfo  Lighthouse resolve info
     * @return Collection
     */
    public function __invoke(
        Event $event,
        array $args,
        $context,
        ResolveInfo $resolveInfo
    ): Collection {
        $user = Auth::user();

        if (! $user) {
            return collect([]);
        }

        return $event->getVisibleEventInstances($user);
    }
}
