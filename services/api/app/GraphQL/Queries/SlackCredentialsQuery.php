<?php

declare(strict_types=1);

namespace App\GraphQL\Queries;

use App\Models\Organization;
use Illuminate\Support\Facades\Auth;
use Nuwave\Lighthouse\Execution\HttpGraphQLContext;
use Nuwave\Lighthouse\Execution\ResolveInfo;

final readonly class SlackCredentialsQuery
{
    public function __invoke(
        $rootValue,
        array $args,
        HttpGraphQLContext $context,
        ResolveInfo $resolveInfo,
    ) {
        $user = Auth::user();

        $query = Organization::query();
        $query->where('slack_team_id', '=', $args['slackTeamId']);
        $organizations = $query->get();

        $credentials = $organizations->map(function ($organization) {
            return [
                'organizationId'   => $organization->id,
                'slackAccessToken' => $organization->slack_access_token,
            ];
        });

        return $credentials;
    }
}
