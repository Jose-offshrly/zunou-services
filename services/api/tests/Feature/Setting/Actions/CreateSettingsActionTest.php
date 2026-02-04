<?php

namespace Feature\Setting\Actions;

use App\Actions\Setting\CreateSettingAction;
use App\DataTransferObjects\FileData;
use App\DataTransferObjects\SettingData;
use App\Models\Organization;
use App\Models\Setting;
use App\Models\User;
use Tests\TestCase;

class CreateSettingsActionTest extends TestCase
{
    public function test_it_can_create_a_setting_resource()
    {
        $user         = User::first();
        $organization = Organization::first();

        $file = new FileData(
            file_key: 'path/to/filename.png',
            file_name: 'filename.png',
        );

        $setting = new SettingData(
            user_id: $user->id,
            organization_id: $organization->id,
            theme: 'dark-mode',
            color: 'primary',
            file: $file,
        );

        $action = app(CreateSettingAction::class);

        $setting = $action->handle(data: $setting);

        $this->assertInstanceOf(Setting::class, $setting);
        $this->assertNotEquals('{}', $setting->metadata);
    }
}
