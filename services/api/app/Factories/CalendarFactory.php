<?php

namespace App\Factories;

use App\Contracts\CalendarInterface;
use App\Models\User;
use App\Services\Calendar\GoogleCalendarService;
use InvalidArgumentException;

class CalendarFactory
{
    public static function make(string $provider, User $user): CalendarInterface
    {
        return match ($provider) {
            'google' => new GoogleCalendarService(user: $user),
            default  => throw new InvalidArgumentException("Unsupported provider: {$provider}"),
        };
    }
}
