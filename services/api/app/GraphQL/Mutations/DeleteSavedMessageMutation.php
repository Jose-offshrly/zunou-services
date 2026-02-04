<?php

declare(strict_types=1);

namespace App\GraphQL\Mutations;

use App\Models\SavedMessage;
use GraphQL\Error\Error;

final readonly class DeleteSavedMessageMutation
{
    /**
     * @throws Error
     */
    public function __invoke(null $_, array $args): bool
    {
        $user = auth()->user();
        if (! $user) {
            throw new Error('No user was found');
        }

        $savedMessage = SavedMessage::findOrFail($args['savedMessageId']);

        return $savedMessage->delete();
    }
}
