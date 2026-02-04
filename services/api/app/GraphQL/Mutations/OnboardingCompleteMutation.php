<?php

declare(strict_types=1);

namespace App\GraphQL\Mutations;

use App\Enums\OrganizationStatus;
use App\Models\Organization;

final readonly class OnboardingCompleteMutation
{
    /** @param  array{}  $args */
    public function __invoke(null $_, array $args)
    {
        Organization::where('id', $args['organization_id'])->update([
            'status' => OrganizationStatus::Active->value,
        ]);

        $organization = Organization::find($args['organization_id']);

        return $organization;
    }
}
