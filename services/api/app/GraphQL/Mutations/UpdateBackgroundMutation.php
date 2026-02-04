<?php

declare(strict_types=1);

namespace App\GraphQL\Mutations;

use App\Actions\Background\UpdateBackgroundAction;
use App\DataTransferObjects\UpdateBackgroundData;
use App\Models\Background;
use GraphQL\Error\Error;
use Illuminate\Support\Facades\Auth;
use Log;

final class UpdateBackgroundMutation
{
    public function __construct(
        private readonly UpdateBackgroundAction $updateBackgroundAction,
    ) {
    }

    public function __invoke($_, array $args): Background
    {
        $user = Auth::user();
        if (! $user) {
            throw new Error('No user was found');
        }

        $background = Background::find($args['backgroundId']);
        if (! $background) {
            throw new Error('No background record was found');
        }

        $data = new UpdateBackgroundData(active: $args['active']);

        Log::info('args: ' . json_encode($args));

        return $this->updateBackgroundAction->handle(
            background: $background,
            data: $data,
        );
    }
}
