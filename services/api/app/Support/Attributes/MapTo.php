<?php

declare(strict_types=1);

namespace App\Support\Attributes;

#[\Attribute(\Attribute::TARGET_PARAMETER)]
class MapTo
{
    public function __construct(public string $class)
    {
    }
}
