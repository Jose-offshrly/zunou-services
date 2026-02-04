<?php

namespace App\Helpers;

use App\Models\User;
use Exception;

class StringHelper
{
    public static function hasPulseMention(string $message): bool
    {
         // Step 1: try to normalize escaped content safely
        $normalized = html_entity_decode($message, ENT_QUOTES, 'UTF-8');   // &quot; → "
        $normalized = stripslashes($normalized);                       // \" → "
        $normalized = preg_replace('/\\\\+/', '\\', $normalized);      // reduce \\ → \

        // Step 2: Look for a "mention" node containing id:"pulse"
        // Flexible regex: allows whitespace, newlines, different orders, escaped chars
        $pattern = '/"type"\s*:\s*"mention".*?"id"\s*:\s*"pulse"/is';

        return preg_match($pattern, $normalized) === 1;
    }
}