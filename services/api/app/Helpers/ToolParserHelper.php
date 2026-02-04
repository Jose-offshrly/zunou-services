<?php

namespace App\Helpers;

class ToolParserHelper
{
    /**
     * Sanitize the array keys and values:
     * - Trim spaces from values.
     * - Clean non-alphabetic characters from the start and end of the keys.
     *
     * @param array $data
     * @return array
     */
    public static function sanitize(array $data)
    {
        $sanitizedData = [];

        foreach ($data as $key => $value) {
            // Sanitize the key (remove non-alphanumeric characters from start and end)
            $cleanedKey = preg_replace(
                '/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/',
                '',
                $key,
            );

            // Trim and clean the value
            $cleanedValue = is_string($value) ? trim($value) : $value;

            // Add the sanitized key and value to the result array
            $sanitizedData[$cleanedKey] = $cleanedValue;
        }

        return $sanitizedData;
    }
}
