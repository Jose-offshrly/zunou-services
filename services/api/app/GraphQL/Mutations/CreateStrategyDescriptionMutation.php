<?php

namespace App\GraphQL\Mutations;

use App\Enums\StrategyType;
use App\Services\StrategyService;
use GraphQL\Error\Error;

final class CreateStrategyDescriptionMutation
{
    /**
     * @throws Error
     * @throws \Exception
     */
    public function __invoke($_, array $args): array
    {
        $user = auth()->user();

        if (! $user) {
            throw new Error('No user was found');
        }

        $type     = $args['input']['type'];
        $freeText = $args['input']['freeText'];
        $result   = null;

        switch ($type) {
            case StrategyType::automations->value:
                $result = StrategyService::generateTitleAndDescriptionForAutomation(
                    $freeText,
                );
                break;
            case StrategyType::missions->value:
                $result = StrategyService::generateTitleAndDescriptionForMission(
                    $freeText,
                );
                break;
            default:
                throw new Error('Invalid strategy type' . $type);
        }

        if (! $result['isSuccess']) {
            $result['description'] = $freeText;
        }

        return $result;
    }
}
