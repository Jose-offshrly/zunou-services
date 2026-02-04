<?php

namespace App\DataTransferObjects;

use App\Support\Data;

class FileData extends Data
{
    public function __construct(
        public readonly string $file_key,
        public readonly string $file_name,
    ) {
    }
}
