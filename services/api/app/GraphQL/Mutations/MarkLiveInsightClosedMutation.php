<?php

declare(strict_types=1);

namespace App\GraphQL\Mutations;

use App\Models\LiveInsightOutbox;

final class MarkLiveInsightClosedMutation
{
    public function __invoke($_, array $args): LiveInsightOutbox
    {
        /** @var LiveInsightOutbox $row */
        $row = LiveInsightOutbox::query()->findOrFail($args['id']);

        $now = now();

        // Only move forward to closed
        if ($row->delivery_status !== 'closed') {
            $row->delivery_status = 'closed';
            $row->closed_at = $now;
        }

        // Only overwrite reason if provided
        if (array_key_exists('reason', $args)) {
            $row->closed_reason = $args['reason'];
        }

        // Closing implies it has been seen
        if (is_null($row->read_at)) {
            $row->read_at = $now;
        }

        $row->updated_at = $now;
        $row->save();

        return $row;
    }
}
