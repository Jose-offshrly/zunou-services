<?php

namespace App\Enums;

enum MeetingType: string
{
    case MEETING    = 'meeting';
    case BRAIN_DUMP = 'brain-dump';

    public static function fromName(string $name): ?self
    {
        foreach (self::cases() as $case) {
            if ($case->name === $name) {
                return $case;
            }
        }

        return null;
    }
}
