<?php

declare(strict_types=1);

namespace App\DataTransferObjects;

final class OrganizationGroupData
{
    public function __construct(
        public readonly string $name,
        public readonly string $description,
        public readonly string $pulse_id,
        public readonly string $organization_id,
    ) {
    }
}
