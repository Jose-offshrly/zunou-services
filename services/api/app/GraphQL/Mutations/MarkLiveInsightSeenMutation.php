<?php

declare(strict_types=1);

namespace App\GraphQL\Mutations;

use App\Models\LiveInsightOutbox;

final class MarkLiveInsightSeenMutation
{
    public function __invoke($_, array $args): LiveInsightOutbox
    {
        /** @var LiveInsightOutbox $row */
        $row = LiveInsightOutbox::query()->findOrFail($args['id']);

        // Never downgrade a closed insight
        if ($row->delivery_status === 'closed') {
            return $row;
        }

        $now = now();
        if (is_null($row->read_at)) {
            $row->read_at = $now;
        }
        if (in_array($row->delivery_status, ['pending', 'delivered'], true)) {
            $row->delivery_status = 'seen';
        }

        $row->updated_at = $now;
        $row->save();

        return $row;
    }
}
