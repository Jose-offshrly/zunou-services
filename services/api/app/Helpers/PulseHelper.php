<?php

namespace App\Helpers;

use App\Models\User;
use Exception;

class PulseHelper
{
    private static ?User $systemUser = null;

    public static function getSystemUser(): ?User
    {
        if (! self::$systemUser) {
            $email      = 'pulse@zunou.ai';
            $systemUser = User::where('email', $email)->first();
            if (is_null($systemUser)) {
                throw new Exception(
                    "Pulse user is not yet set, tried looking for this email: $email",
                );
            }

            self::$systemUser = $systemUser;
        }

        return self::$systemUser;
    }
}
