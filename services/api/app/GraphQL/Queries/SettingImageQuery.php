<?php

declare(strict_types=1);

namespace App\GraphQL\Queries;

use App\Models\Setting;
use Illuminate\Support\Facades\Storage;

class SettingImageQuery
{
    public function __invoke($root, array $args)
    {
        $setting  = Setting::findOrFail($args['settingId']);
        $metadata = $setting->metadata    ?? [];
        $fileKey  = $metadata['fileKey']  ?? null;
        $fileName = $metadata['fileName'] ?? null;

        if (! $fileKey) {
            return ['url' => null, 'fileName' => null];
        }

        $url = Storage::disk('s3')->temporaryUrl(
            $fileKey,
            now()->addMinutes(5),
        );

        return [
            'url'      => $url,
            'fileName' => $fileName,
        ];
    }
}
