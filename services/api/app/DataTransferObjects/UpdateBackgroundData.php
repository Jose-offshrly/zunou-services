<?php

declare(strict_types=1);

namespace App\DataTransferObjects;

final class UpdateBackgroundData
{
    public function __construct(public readonly bool $active)
    {
    }
}
