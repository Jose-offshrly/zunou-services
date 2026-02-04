<?php

namespace App\DataTransferObjects;

final readonly class TemporaryFileData
{
    public function __construct(
        public string $fileName,
        public string $tempFilePath,
    ) {
    }
}
