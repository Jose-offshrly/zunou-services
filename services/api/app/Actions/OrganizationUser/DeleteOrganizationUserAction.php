<?php

namespace App\Actions\OrganizationUser;

use App\Models\OrganizationUser;

class DeleteOrganizationUserAction
{
    public function handle(OrganizationUser $organizationUser): bool
    {
        return $organizationUser->delete();
    }
}
