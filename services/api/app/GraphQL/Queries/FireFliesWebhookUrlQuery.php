<?php

declare(strict_types=1);

namespace App\GraphQL\Queries;

use GraphQL\Error\Error;

final readonly class FireFliesWebhookUrlQuery
{
    public function __invoke($rootValue, array $args): string
    {
        $user = auth()->user();
        if (! $user) {
            throw new Error('No user was found');
        }

        if (! isset($args['pulseId'])) {
            throw new Error('pulseId is required');
        }
        $pulseId = $args['pulseId'];

        // Retrieve the integration with type "fireflies" matching the provided pulse id.
        $integration = $user->integrations->first(
            fn ($integration) => $integration->type === 'fireflies' && $integration->pulse_id === $pulseId,
        );
        if (! $integration) {
            throw new Error('No matching fireflies integration found');
        }

        return route('fireflies.webhook', [
            'user'    => $user->id,
            'api_key' => $integration->api_key,
        ]);
    }
}
