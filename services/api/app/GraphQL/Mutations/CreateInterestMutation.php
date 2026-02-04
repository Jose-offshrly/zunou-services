<?php

namespace App\GraphQL\Mutations;

use App\Actions\CreateInterestAction;
use App\DataTransferObjects\InterestData;
use App\Models\Interest;
use Exception;
use GraphQL\Error\Error;

readonly class CreateInterestMutation
{

    public function __construct(
        private CreateInterestAction $createInterestAction,
    ) {
    }

    public function __invoke($_, array $args): Interest
    {
        try {
            $data = InterestData::from($args['input']);
            return $this->createInterestAction->handle(data: $data);
        } catch (Exception $e) {
            throw new Error('Failed to send an interest: ' . $e->getMessage());
        }
    }
}
