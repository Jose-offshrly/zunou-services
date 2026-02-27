<?php

declare(strict_types=1);

namespace App\GraphQL\Mutations;

use App\Actions\PulseMember\UpdatePulseMemberAction;
use App\DataTransferObjects\PulseMemberData;
use App\Models\PulseMember;
use GraphQL\Error\Error;

readonly class UpdatePulseMemberMutation
{
    public function __construct(
        private readonly UpdatePulseMemberAction $updatePulseMemberMutation,
    ) {
    }

    public function __invoke($_, array $args): PulseMember
    {
        try {
            $input = $args['input'];

            $member = PulseMember::find($input['pulseMemberId']);

            if (! $member) {
                throw new Error('Pulse member not found.');
            }

            $data = new PulseMemberData(
                job_description: $input['jobDescription'],
                responsibilities: $input['responsibilities'],
            );

            return $this->updatePulseMemberMutation->handle(
                data: $data,
                member: $member,
            );
        } catch (\Exception $e) {
            if ($e instanceof Error) {
                throw $e;
            }
            throw new Error('Failed to update pulse member: ' . $e->getMessage());
        }
    }
}
