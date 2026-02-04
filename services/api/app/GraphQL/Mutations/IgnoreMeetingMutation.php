<?php

namespace App\GraphQL\Mutations;

use App\Models\Meeting;
use GraphQL\Error\Error;

class IgnoreMeetingMutation
{
    /**
     * @throws Error
     * @throws \Exception
     */
    public function __invoke($_, array $args): Meeting
    {
        $user = auth()->user();
        if (! $user) {
            throw new Error('No user was found');
        }

        $meeting = Meeting::findOrFail($args['meetingId']);

        $meeting->is_viewable = false;
        $meeting->status      = 'ignored';
        $meeting->save();

        return $meeting->refresh();
    }
}
