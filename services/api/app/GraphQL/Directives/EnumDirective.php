<?php

namespace App\GraphQL\Directives;

use Nuwave\Lighthouse\Schema\Directives\BaseDirective;

class EnumDirective extends BaseDirective
{
    public static function definition(): string
    {
        return /** @lang GraphQL */ <<<'GRAPHQL'
"""
Auto-generate GraphQL enum from PHP enum.
"""
directive @enum(class: String!) on ENUM
GRAPHQL;
    }
}
