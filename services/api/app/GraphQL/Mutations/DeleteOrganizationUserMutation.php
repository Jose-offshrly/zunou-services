<?php

namespace App\GraphQL\Mutations;

use App\Actions\OrganizationUser\DeleteOrganizationUserAction;
use App\Models\OrganizationUser;
use GraphQL\Error\Error;

class DeleteOrganizationUserMutation
{
    public function __construct(
        private DeleteOrganizationUserAction $deleteOrganizationUserAction,
    ) {
    }

    /**
     * @throws Error
     */
    public function __invoke(null $_, array $args): bool
    {
        $organizationUser = OrganizationUser::findOrFail(
            $args['organizationUserId'],
        );

        if (! $organizationUser) {
            throw new Error('Organization user not found.');
        }

        return $this->deleteOrganizationUserAction->handle(
            organizationUser: $organizationUser,
        );
    }
}
