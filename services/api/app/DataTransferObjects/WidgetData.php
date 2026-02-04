<?php

namespace App\DataTransferObjects;

class WidgetData
{
    public function __construct(
        public readonly string $user_id,
        public readonly string $organization_id,
        public readonly string $name,
        public readonly int $columns = 1,
    ) {
    }
}
