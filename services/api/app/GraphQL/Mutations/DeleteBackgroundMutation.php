<?php

declare(strict_types=1);

namespace App\GraphQL\Mutations;

use App\Actions\Background\DeleteBackgroundAction;
use App\Models\Background;
use GraphQL\Error\Error;

final class DeleteBackgroundMutation
{
    public function __construct(
        private readonly DeleteBackgroundAction $deleteBackgroundAction,
    ) {
    }

    public function __invoke($_, array $args): bool
    {
        try {
            $background = Background::find($args['backgroundId']);
            if (! $background) {
                throw new Error('Background not found!');
            }

            return $this->deleteBackgroundAction->handle(
                background: $background,
            );
        } catch (\Exception $e) {
            throw new Error('Failed to create a widget: ' . $e->getMessage());
        }
    }
}
