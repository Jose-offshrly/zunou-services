<?php

namespace App\GraphQL\Mutations;

use App\Actions\TeamThread\CreateTeamThreadAction;
use App\DataTransferObjects\TeamThreadData;
use App\Models\TeamThread;
use GraphQL\Error\Error;

readonly class CreateTeamThreadMutation
{
    public function __construct(
        private CreateTeamThreadAction $createTeamThreadAction,
    ) {
    }

    public function __invoke($_, array $args): TeamThread
    {
        try {
            return $this->createTeamThread($args['input']);
        } catch (\Exception $e) {
            throw new Error(
                'Failed to create a team thread: ' . $e->getMessage(),
            );
        }
    }

    private function createTeamThread(array $input): TeamThread
    {
        $data = new TeamThreadData(
            pulse_id: $input['pulseId'],
            organization_id: $input['organizationId'],
        );

        return $this->createTeamThreadAction->handle($data);
    }
}
