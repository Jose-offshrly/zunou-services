<?php

namespace App\Actions\Setting;

use App\DataTransferObjects\SettingData;
use App\Models\Setting;

class UpdateSettingAction
{
    public function handle(Setting $setting, SettingData $data): Setting
    {
        $setting->update([
            'theme' => $data->theme,
            'color' => $data->color,
            'mode' => $data->mode,
            'weekend_display' => $data->weekend_display,
        ]);

        return $setting->refresh();
    }
}
