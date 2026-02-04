<?php

declare(strict_types=1);

namespace App\GraphQL\Scalars;

use GraphQL\Type\Definition\ScalarType;

class JSON extends ScalarType
{
    public string $name = 'JSON';

    public function serialize($value)
    {
        return $value;
    }

    public function parseValue($value)
    {
        return $value;
    }

    public function parseLiteral($valueNode, ?array $variables = null)
    {
        return json_decode(json_encode($valueNode), true);
    }
}
