<?php

namespace App\Helpers;

use Illuminate\Support\Collection;

class KeyTermsHelper
{
    /**
     * Maximum number of keyterms allowed in the result.
     */
    public const MAX_KEYTERMS = 100;

    /**
     * Extract keyterms from a collection of attendees.
     * Returns an array of full names and first names, limited to MAX_KEYTERMS items.
     *
     * @param  Collection  $attendees  Attendees with 'user' relationship loaded
     * @return array<string>
     */
    public static function fromAttendees(Collection $attendees): array
    {
        // Limit attendees to ensure we don't exceed MAX_KEYTERMS (2 items per attendee)
        $maxAttendees = (int) floor(self::MAX_KEYTERMS / 2);

        return $attendees
            ->take($maxAttendees)
            ->flatMap(fn ($attendee) => self::extractNames($attendee->user->name ?? ''))
            ->unique()
            ->take(self::MAX_KEYTERMS)
            ->values()
            ->toArray();
    }

    /**
     * Extract full name and first name from a given name string.
     *
     * @param  string  $fullName  The full name to extract from
     * @return array<string>
     */
    public static function extractNames(string $fullName): array
    {
        $fullName  = trim($fullName);
        $firstName = self::extractFirstName($fullName);

        return array_filter([$fullName, $firstName]);
    }

    /**
     * Extract the first name from a full name string.
     *
     * @param  string  $fullName  The full name to extract from
     * @return string
     */
    public static function extractFirstName(string $fullName): string
    {
        $parts = explode(' ', trim($fullName));

        return $parts[0] ?? '';
    }
}

