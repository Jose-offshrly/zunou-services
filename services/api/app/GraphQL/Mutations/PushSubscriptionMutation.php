<?php

declare(strict_types=1);

namespace App\GraphQL\Mutations;

use Illuminate\Support\Facades\Auth;

readonly class PushSubscriptionMutation
{
    /** @param  array{}  $args */
    public function __invoke(null $_, array $args)
    {
        $user = Auth::user();

        $sub = $args['input'];
        $user->updatePushSubscription(
            $sub['endpoint'],
            $sub['p256dh'],
            $sub['auth'],
            $sub['contentEncoding'] ?? 'aesgcm', // fallback if needed
        );

        return true;
    }
}
