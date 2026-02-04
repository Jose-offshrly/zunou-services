<?php

declare(strict_types=1);

namespace App\Helpers;

class LocationHelper
{
    /**
     * Check if a location is online by detecting video conferencing URLs and online meeting patterns
     */
    public static function isLocationOnline(?string $location): bool
    {
        if (empty($location)) {
            return false;
        }

        $location = strtolower(trim($location));

        // Check for common online meeting indicators
        $onlineIndicators = [
            'online',
            'virtual',
            'remote',
            'video call',
            'video meeting',
            'web conference',
            'webinar',
            'zoom',
            'teams',
            'webex',
            'skype',
            'discord',
            'slack',
            'hangouts',
            'meet.google.com',
            'zoom.us',
            'teams.microsoft.com',
            'webex.com',
            'skype.com',
            'discord.gg',
            'slack.com',
        ];

        foreach ($onlineIndicators as $indicator) {
            if (str_contains($location, $indicator)) {
                return true;
            }
        }

        // Check for URL patterns
        $urlPatterns = [
            '/https?:\/\/meet\.google\.com\/[a-zA-Z0-9\-_]+/',
            '/https?:\/\/zoom\.us\/[a-zA-Z0-9\-_]+/',
            '/https?:\/\/teams\.microsoft\.com\/[a-zA-Z0-9\-_]+/',
            '/https?:\/\/webex\.com\/[a-zA-Z0-9\-_]+/',
            '/https?:\/\/skype\.com\/[a-zA-Z0-9\-_]+/',
            '/https?:\/\/discord\.gg\/[a-zA-Z0-9\-_]+/',
            '/https?:\/\/slack\.com\/[a-zA-Z0-9\-_]+/',
            '/https?:\/\/hangouts\.google\.com\/[a-zA-Z0-9\-_]+/',
        ];

        foreach ($urlPatterns as $pattern) {
            if (preg_match($pattern, $location)) {
                return true;
            }
        }

        return false;
    }
}
