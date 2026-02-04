<?php

declare(strict_types=1);

namespace App\GraphQL\Mutations;

use Illuminate\Support\Facades\Config;

final readonly class OnboardingGenerateSlackInstallUriMutation
{
    /** @param  array{}  $args */
    public function __invoke(null $_, array $args)
    {
        $clientID = Config::get('zunou.slack.client_id');

        $scope = urlencode(
            implode(',', [
                'app_mentions:read',
                'channels:history',
                'channels:read',
                'chat:write',
                'chat:write.public',
                'commands',
                'groups:history',
                'im:history',
            ]),
        );

        $state = urlencode($args['organizationId']);

        $redirectUri = urlencode($args['redirectUri']);

        return [
            'uri' => "https://slack.com/oauth/v2/authorize?client_id={$clientID}&scope={$scope}&redirect_uri={$redirectUri}",
        ];
    }
}
