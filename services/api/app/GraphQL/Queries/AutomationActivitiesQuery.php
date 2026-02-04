<?php

declare(strict_types=1);

namespace App\GraphQL\Queries;

use App\Models\Automation;

final readonly class AutomationActivitiesQuery
{
    /** @param  array{}  $args */
    public function __invoke(Automation $automation)
    {
        // Eager load causer to prevent N+1 queries
        return $automation->activities()
            ->with('causer')
            ->orderBy('created_at', 'desc')
            ->get();
    }
}
