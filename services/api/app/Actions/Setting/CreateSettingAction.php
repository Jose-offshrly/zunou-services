<?php

namespace App\Actions\Setting;

use App\DataTransferObjects\SettingData;
use App\Models\Setting;

class CreateSettingAction
{
    public function handle(SettingData $data): Setting
    {
        $existingSettings = Setting::where('user_id', $data->user_id)
            ->where('organization_id', $data->organization_id)
            ->orderBy('updated_at', 'desc')
            ->get();

        if ($existingSettings->count() > 1) {
            $existingSettings->skip(1)->each->delete();
        }

        $setting = Setting::updateOrCreate(
            [
                'user_id' => $data->user_id,
                'organization_id' => $data->organization_id,
            ],
            [
                'theme' => $data->theme,
                'color' => $data->color,
                'mode' => $data->mode,
                'weekend_display' => $data->weekend_display,
            ]
        );

        if (isset($data->file->file_key)) {
            $setting->fileKey = $data->file->file_key;
        }

        if (isset($data->file->file_name)) {
            $setting->fileName = $data->file->file_name;
        }

        $setting->save();

        return $setting->refresh();
    }
}
