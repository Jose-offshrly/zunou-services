<?php

declare(strict_types=1);

namespace App\GraphQL\Mutations;

use App\Actions\OrganizationGroup\CreateOrganizationGroupAction;
use App\DataTransferObjects\OrganizationGroupData;
use App\Models\OrganizationGroup;
use GraphQL\Error\Error;
use Illuminate\Support\Facades\Auth;

readonly class CreateOrganizationGroupMutation
{
    public function __construct(
        private readonly CreateOrganizationGroupAction $createOrganizationGroupAction,
    ) {
    }

    public function __invoke($_, array $args): OrganizationGroup
    {
        try {
            $user = Auth::user();
            if (! $user) {
                throw new Error('no user found!');
            }

            $data = new OrganizationGroupData(
                name: $args['name'],
                description: $args['description'],
                pulse_id: $args['pulseId'],
                organization_id: $args['organizationId'],
            );

            return $this->createOrganizationGroupAction->handle(data: $data);
        } catch (\Exception $e) {
            throw new Error('Failed to create group: ' . $e->getMessage());
        }
    }
}
