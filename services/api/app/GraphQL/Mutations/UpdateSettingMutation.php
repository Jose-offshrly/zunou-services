<?php

namespace App\GraphQL\Mutations;

use App\Actions\Setting\UpdateSettingAction;
use App\DataTransferObjects\SettingData;
use App\Models\Setting;
use GraphQL\Error\Error;

class UpdateSettingMutation
{
    public function __construct(
        private readonly UpdateSettingAction $updateSettingAction
    ) {
    }

    public function __invoke($_, array $args): Setting
    {
        try {
            $setting = Setting::find($args['settingId']);

            if (!$setting) {
                throw new Error('User settings not found. please create one');
            }

            $data = new SettingData(
                user_id: $setting->user_id,
                organization_id: $setting->organization_id,
                theme: $args['theme'],
                color: $args['color'],
                mode: $args['mode'],
                weekend_display: $args['weekendDisplay'] ??
                    $setting->weekend_display
            );

            return $this->updateSettingAction->handle(
                setting: $setting,
                data: $data
            );
        } catch (\Exception $e) {
            throw new Error(
                'Failed to update user setting: ' . $e->getMessage()
            );
        }
    }
}
