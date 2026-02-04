<?php

declare(strict_types=1);

namespace App\GraphQL\Mutations;

use App\Enums\OrganizationStatus;
use App\Models\DataSource;
use App\Models\Organization;
use GraphQL\Error\Error;

final readonly class OnboardingConfirmDataSourcesMutation
{
    /** @param  array{}  $args */
    public function __invoke(null $_, array $args)
    {
        Organization::where('id', $args['organization_id'])->update([
            'status' => OrganizationStatus::OnboardingSlack->value,
        ]);

        $dataSources = DataSource::query()
            ->where(
                'data_sources.organization_id',
                '=',
                $args['organization_id'],
            )
            ->select('data_sources.*')
            ->paginate();

        if ($dataSources->total() === 0) {
            throw new Error('You must connect at least one data source');
        }

        return $dataSources;
    }
}
