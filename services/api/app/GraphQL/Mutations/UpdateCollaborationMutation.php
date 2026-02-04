<?php

declare(strict_types=1);

namespace App\GraphQL\Mutations;

use App\Actions\Collaboration\UpdateCollaborationAction;
use App\DataTransferObjects\UpdateCollaborationData;
use App\Models\Collaboration;
use GraphQL\Error\Error;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

final class UpdateCollaborationMutation
{
    public function __construct(
        private readonly UpdateCollaborationAction $updateCollaborationAction,
    ) {
    }

    public function __invoke($_, array $args): Collaboration
    {
        $user = Auth::user();
        if (! $user) {
            throw new Error('No user was found');
        }

        $collaboration = Collaboration::find($args['collaborationId']);
        if (! $collaboration) {
            throw new Error('No collaboration record was found');
        }

        $data = new UpdateCollaborationData(status: $args['status']);

        Log::info('args: ' . json_encode($args));

        return $this->updateCollaborationAction->handle(
            collaboration: $collaboration,
            data: $data,
        );
    }
}
