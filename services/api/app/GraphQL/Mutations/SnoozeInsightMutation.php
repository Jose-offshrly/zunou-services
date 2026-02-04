<?php

declare(strict_types=1);

namespace App\GraphQL\Mutations;

use App\Models\LiveInsightOutbox;
use GraphQL\Error\Error;

final class SnoozeInsightMutation
{
    public function __invoke($_, array $args): LiveInsightOutbox
    {
        $row = LiveInsightOutbox::query()->findOrFail($args['id']);

        // Validate that the insight can be snoozed
        if ($row->delivery_status === 'closed') {
            throw new Error('Cannot snooze a closed insight');
        }

        $remindAt = $args['remindAt'];
        
        // Validate that remind_at is in the future
        if (now()->gte($remindAt)) {
            throw new Error('Remind time must be in the future');
        }

        $now = now();
        
        // Update the insight with snooze information
        $row->remind_at = $remindAt;
        $row->snooze_count = ($row->snooze_count ?? 0) + 1;
        $row->delivery_status = 'pending'; // Reset to pending when snoozed
        $row->updated_at = $now;
        
        $row->save();

        return $row;
    }
}
