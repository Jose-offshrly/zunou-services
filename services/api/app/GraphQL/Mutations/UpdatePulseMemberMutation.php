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
            $data   = new PulseMemberData(
                job_description: $input['jobDescription'],
                responsibilities: $input['responsibilities'],
            );

            return $this->updatePulseMemberMutation->handle(
                data: $data,
                member: $member,
            );
        } catch (\Exception $e) {
            throw new Error('Failed to update pulse member: ' . $e);
        }
    }
}
