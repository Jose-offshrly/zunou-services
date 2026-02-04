<?php

declare(strict_types=1);

namespace App\Actions\OrganizationGroup;

use App\DataTransferObjects\OrganizationGroupData;
use App\Models\OrganizationGroup;

final class CreateOrganizationGroupAction
{
    public function handle(OrganizationGroupData $data): OrganizationGroup
    {
        $group = OrganizationGroup::create([
            'name'            => $data->name,
            'description'     => $data->description,
            'pulse_id'        => $data->pulse_id,
            'organization_id' => $data->organization_id,
        ]);

        return $group->refresh();
    }
}
