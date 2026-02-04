<?php

namespace App\Facades;

use App\Services\Pusher\BeamsService;
use Illuminate\Support\Facades\Facade;

/**
 * @method static bool isEnabled()
 * @method static Pusher\PushNotifications\PushNotifications getClient()
 * @method static string publishToInterests(array $interests, array $payload)
 * @method static string publishToUsers(array $userIds, array $payload)
 * @method static void deleteUser(string $userId)
 */
class Beams extends Facade
{
    protected static function getFacadeAccessor(): string
    {
        return BeamsService::class;
    }
}
