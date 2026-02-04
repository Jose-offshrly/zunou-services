<?php

declare(strict_types=1);

namespace App\GraphQL\Mutations;

use App\DataTransferObjects\IntegrationData;
use App\Jobs\ProcessFireFliesMeetingsJob;
use App\Models\Integration;
use App\Models\User;

final readonly class RefetchIntegrationMutation
{
    /** @param  array{}  $args */
    public function __invoke(null $_, array $args)
    {
        // Lookup the integration record using the input fields
        $integration = Integration::forUser($args['user_id'])
            ->forPulse($args['pulse_id'])
            ->where('type', $args['type'])
            ->first();
        if (!$integration) {
            throw new \Exception('Integration not found');
        }

        // Retrieve the user from the database
        $user = User::find($args['user_id']);
        if (!$user) {
            throw new \Exception('User not found');
        }

        // Create integration data dto using the integration info
        $data = new IntegrationData(
            user_id: $integration->user_id,
            pulse_id: $integration->pulse_id,
            type: $integration->type,
            api_key: $integration->api_key
        );

        // Process meetings job synchronously
        ProcessFireFliesMeetingsJob::dispatch($data, $user);

        $integration->refresh();
        return $integration;
    }
}
