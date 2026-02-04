<?php

namespace App\DataTransferObjects;

readonly class SummaryData
{
    public function __construct(public string $summary, public string $name)
    {
    }
}
