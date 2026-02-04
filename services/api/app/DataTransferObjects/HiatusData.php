<?php

namespace App\DataTransferObjects;

class HiatusData
{
    public function __construct(
        public readonly string $user_id,
        public readonly string $timesheet_id,
    ) {
    }
}
