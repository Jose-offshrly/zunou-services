<?php

declare(strict_types=1);

namespace App\GraphQL\Queries;

use App\Models\Thread;
use GraphQL\Error\Error;
use Illuminate\Support\Facades\Auth;

final readonly class ActiveThreadQuery
{
    public function __invoke($root, array $args): ?Thread
    {
        $user = Auth::user();
        if (!$user) {
            throw new error('No user was found');
        }
        return Thread::forPulse($args['pulseId'])
            ->forOrganization($args['organizationId'])
            ->forUser($user->id)
            ->whereActive(true)
            ->where('type', $args['type'])
            ->first();
    }
}
