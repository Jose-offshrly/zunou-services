<?php

namespace App\GraphQL\Queries;

use App\Models\MonthlyTimeSaved;
use Illuminate\Support\Collection;

class TimeSavedQuery
{
    public function __invoke($root, array $args): Collection
    {
        // Fetch time saved data based on the organization ID
        $timeSavedData = MonthlyTimeSaved::where(
            'organization_id',
            $args['organizationId'],
        )
            ->where('pulse_id', $args['pulseId'])
            ->orderBy('year', 'asc')
            ->orderBy('month', 'asc')
            ->get(['time_saved as time', 'month', 'year']);

        return $timeSavedData;
    }
}
