<?php

declare(strict_types=1);

namespace App\DataTransferObjects\Task;

final class SourceData
{
    public function __construct(
        public readonly string $type,
        public readonly string $id,
    ) {
    }
}
