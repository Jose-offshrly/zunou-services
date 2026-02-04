<?php

declare(strict_types=1);

namespace Tests\Unit;

use Aws\Result;

class FakeSqsClient
{
    protected array $payload;

    public function __construct(array $payload)
    {
        $this->payload = $payload;
    }

    public function __call($method, $args)
    {
        if ($method === 'receiveMessage') {
            return new Result($this->payload);
        }

        return null;
    }
}
