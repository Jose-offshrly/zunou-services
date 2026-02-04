<?php

declare(strict_types=1);

namespace App\GraphQL\Mutations;

use App\Enums\OrganizationStatus;
use App\Models\Organization;
use GraphQL\Error\Error;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

final readonly class OnboardingConfirmSlackMutation
{
    /** @param  array{}  $args */
    public function __invoke(null $_, array $args)
    {
        $organization = Organization::find($args['organization_id']);
        if (! $organization) {
            throw new Error("The organization couldn't be found");
        }

        $url    = 'https://slack.com/api/oauth.v2.access';
        $params = [
            'client_id'     => Config::get('zunou.slack.client_id'),
            'client_secret' => Config::get('zunou.slack.client_secret'),
            'code'          => $args['code'],
            'redirect_uri'  => Config::get('zunou.dashboard.base_url') .
                '/settings/slack/auth?organizationId=' .
                $organization->id,
        ];
        Log::info('params', $params);
        $response = Http::asForm()->post($url, $params);

        $data = $response->json();
        if (! isset($data['ok']) || $data['ok'] !== true) {
            Log::error('Failed to fetch Slack code', ['data' => $data]);
            throw new Error($data['error']);
        }

        Log::info('Fetched Slack code', ['data' => $data]);
        $organization->slack_access_token = $data['access_token'];
        $organization->slack_team_id      = $data['team']['id'];
        $organization->status             = OrganizationStatus::OnboardingComplete->value;
        $organization->save();

        return $organization;
    }
}
