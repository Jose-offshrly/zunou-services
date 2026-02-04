<?php

namespace App\DataTransferObjects;

final class UpdateCollaborationData
{
    public function __construct(public readonly string $status)
    {
    }
}
