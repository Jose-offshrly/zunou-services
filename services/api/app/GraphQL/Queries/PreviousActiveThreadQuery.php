<?php

declare(strict_types=1);

namespace App\GraphQL\Queries;

use App\Models\Thread;
use Illuminate\Support\Facades\Auth;

final readonly class PreviousActiveThreadQuery
{
    /** @param  array{}  $args */
    public function __invoke(null $_, array $args)
    {
        $user = Auth::user();

        $activeThread = Thread::forUser($user->id)
            ->forOrganization($args['organizationId'])
            ->where('is_active', false)
            ->forPulse($args['pulseId'])
            ->orderBy('updated_at', 'desc')
            ->first();

        if (!$activeThread) {
            return null;
        }

        return $activeThread;
    }
}
