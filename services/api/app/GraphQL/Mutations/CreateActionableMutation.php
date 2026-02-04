<?php

declare(strict_types=1);

namespace App\GraphQL\Mutations;

use App\Actions\Actionable\CreateActionableAction;
use App\DataTransferObjects\ActionableData;
use App\Models\Actionable;
use GraphQL\Error\Error;

final class CreateActionableMutation
{
    public function __construct(
        private readonly CreateActionableAction $createActionableAction,
    ) {
    }

    public function __invoke($_, array $args): Actionable
    {
        try {
            $actionableData = ActionableData::from($args);

            return $this->createActionableAction->handle($actionableData);
        } catch (\Exception $e) {
            throw new Error('Failed to create actionable: ' . $e->getMessage());
        }
    }
}
