<?php

namespace App\GraphQL\Mutations;

use App\Actions\Integration\DeleteIntegrationAction;
use App\Models\Integration;
use GraphQL\Error\Error;

final class DeleteIntegrationMutation
{
    public function __construct(
        private readonly DeleteIntegrationAction $deleteIntegrationAction,
    ) {
    }

    /**
     * @throws Error
     */
    public function __invoke(null $_, array $args): bool
    {
        $integration = Integration::find($args['integrationId']);

        if (! $integration) {
            throw new Error('integration not found');
        }

        return $this->deleteIntegrationAction->handle(
            integration: $integration,
        );
    }
}
