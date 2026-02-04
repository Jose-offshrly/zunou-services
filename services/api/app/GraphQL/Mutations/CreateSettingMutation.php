<?php

declare(strict_types=1);

namespace App\GraphQL\Mutations;

use App\Actions\Setting\CreateSettingAction;
use App\DataTransferObjects\FileData;
use App\DataTransferObjects\SettingData;
use App\Models\Setting;
use GraphQL\Error\Error;

final class CreateSettingMutation
{
    public function __construct(
        private readonly CreateSettingAction $createSettingAction
    ) {
    }

    public function __invoke($_, array $args): Setting
    {
        try {
            $file = isset($args['file_key'], $args['file_name'])
                ? new FileData(
                    file_key: $args['file_key'],
                    file_name: $args['file_name']
                )
                : null;

            $setting = new SettingData(
                user_id: $args['userId'],
                organization_id: $args['organizationId'],
                theme: $args['theme'],
                color: $args['color'],
                mode: $args['mode'],
                weekend_display: $args['weekendDisplay'] ?? 'default',
                file: $file
            );

            return $this->createSettingAction->handle(data: $setting);
        } catch (\Exception $e) {
            throw new Error(
                'Failed to create user setting: ' . $e->getMessage()
            );
        }
    }
}
