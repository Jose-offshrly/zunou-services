<?php

namespace App\DataTransferObjects;

class SettingData
{
    public function __construct(
        public readonly string $user_id,
        public readonly string $organization_id,
        public readonly string $theme,
        public readonly string $color,
        public readonly string $mode,
        public readonly string $weekend_display = 'default',
        public readonly ?FileData $file = null
    ) {
    }
}
