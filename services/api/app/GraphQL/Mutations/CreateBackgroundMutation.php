<?php

declare(strict_types=1);

namespace App\GraphQL\Mutations;

use App\Actions\Background\CreateBackgroundAction;
use App\DataTransferObjects\BackgroundData;
use App\DataTransferObjects\FileData;
use App\Models\Background;
use GraphQL\Error\Error;

final class CreateBackgroundMutation
{
    public function __construct(
        private readonly CreateBackgroundAction $createBackgroundAction,
    ) {
    }

    public function __invoke($_, array $args): Background
    {
        try {
            $file = new FileData(
                file_key: $args['file_key'],
                file_name: $args['file_name'],
            );

            $data = new BackgroundData(
                file: $file,
                active: $args['active'],
                user_id: $args['userId'],
                organization_id: $args['organizationId'],
            );

            return $this->createBackgroundAction->handle(data: $data);
        } catch (\Exception $e) {
            throw new Error(
                'Failed to create user setting background: ' . $e->getMessage(),
            );
        }
    }
}
