<?php

declare(strict_types=1);

namespace App\GraphQL\Queries;

use App\Models\Automation;

final readonly class AutomationLogQuery
{
    /** @param  array{}  $args */
    public function __invoke(null $_, array $args)
    {
        $automation = Automation::where(
            'strategy_id',
            $args['strategyId'],
        )->first();

        if (! $automation) {
            return [];
        }

        // Eager load causer to prevent N+1 queries
        return $automation
            ->activities()
            ->with('causer')
            ->where('description', 'Automation run completed')
            ->orderBy('created_at', 'desc')
            ->get();
    }
}
