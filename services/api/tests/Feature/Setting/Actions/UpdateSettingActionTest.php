<?php

namespace Feature\Setting\Actions;

use App\Actions\Setting\UpdateSettingAction;
use App\DataTransferObjects\FileData;
use App\DataTransferObjects\SettingData;
use App\Models\Setting;
use Tests\TestCase;

class UpdateSettingActionTest extends TestCase
{
    public function test_it_can_update_a_given_setting_resource()
    {
        $setting = Setting::first();

        $file = new FileData(
            file_key: 'path/to/filename.png',
            file_name: 'filename.png',
        );

        $data = new SettingData(
            user_id: $setting->user_id,
            organization_id: $setting->organization_id,
            theme: 'dark',
            color: 'secondary',
            file: $file,
        );
        $action = app(UpdateSettingAction::class);

        $setting = $action->handle(setting: $setting, data: $data);

        $this->assertInstanceOf(Setting::class, $setting);
        $this->assertEquals('secondary', $setting->color);
        $this->assertEquals('dark', $setting->theme);
    }
}
