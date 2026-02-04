<?php

declare(strict_types=1);

namespace App\GraphQL\Mutations;

use App\Enums\StrategyType;
use App\Events\StrategiesUpdated;
use App\Models\Automation;
use App\Models\Strategy;
use GraphQL\Error\Error;

final readonly class DeleteStrategyMutation
{
    /**
     * @throws Error
     */
    public function __invoke(null $_, array $args)
    {
        $user = auth()->user();
        if (! $user) {
            throw new Error('No user was found');
        }
        $goal = Strategy::findOrFail($args['strategyId']);

        if ($goal->type === StrategyType::automations) {
            // set automation to on_queue = false
            $automation = Automation::where('strategy_id', $goal->id)->first();
            if ($automation) {
                $automation->on_queue = false;
                $automation->save();
            }
        }

        $goal->delete();

        event(new StrategiesUpdated($goal->organization_id, $goal->pulse_id));

        return $goal;
    }
}
