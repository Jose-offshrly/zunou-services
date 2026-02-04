<?php

namespace App\Services\Agents\Helpers;

class UuidHelper
{
    /**
     * Extract and return a UUID from a string, stripping any extra characters.
     * Returns null if no UUID is found.
     *
     * @param string|null $input
     * @return string|null
     */
    public static function clean(string $input): ?string
    {
        if (empty($input)) {
            return null;
        }

        // Match a standard UUID (without enforcing version/variant)
        if (
            preg_match(
                '/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i',
                $input,
                $matches,
            )
        ) {
            return strtolower($matches[1]); // optional: normalize to lowercase
        }

        return null;
    }
}
