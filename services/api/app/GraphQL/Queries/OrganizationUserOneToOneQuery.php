<?php

declare(strict_types=1);

namespace App\GraphQL\Queries;

use App\Models\OrganizationUser;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

final readonly class OrganizationUserOneToOneQuery
{
    private const CACHE_KEY = 'user_one_to_one_pulses';

    public function __invoke(OrganizationUser $organizationUser): ?string
    {
        $authUserId = Auth::id();
        $thisUserId = $organizationUser->user_id;

        // Don't return anything if the user is the same as the auth user
        if ($thisUserId === $authUserId) {
            return null;
        }

        $oneToOnePulses = $this->getOneToOnePulses($authUserId);

        // Find a pulse where this user is also a member
        return $oneToOnePulses[$thisUserId] ?? null;
    }

    /**
     * Batch-load all ONETOONE pulses for the auth user once per request.
     * Returns a map of [other_user_id => pulse_id]
     */
    private function getOneToOnePulses(?string $authUserId): array
    {
        if (! $authUserId) {
            return [];
        }

        $cacheKey = self::CACHE_KEY.'_'.$authUserId;

        if (app()->bound($cacheKey)) {
            return app($cacheKey);
        }

        // Build a map of other_user_id => pulse_id using JOINs (faster than subquery)
        // pm_auth: finds pulses where auth user is a member
        // pm_other: finds the OTHER member in those same pulses
        $oneToOneMap = DB::table('pulse_members as pm_auth')
            ->join('pulses', function ($join) {
                $join->on('pulses.id', '=', 'pm_auth.pulse_id')
                    ->where('pulses.category', '=', 'ONETOONE');
            })
            ->join('pulse_members as pm_other', 'pm_other.pulse_id', '=', 'pm_auth.pulse_id')
            ->where('pm_auth.user_id', '=', $authUserId)
            ->where('pm_other.user_id', '!=', $authUserId)
            ->pluck('pm_other.pulse_id', 'pm_other.user_id')
            ->all();

        app()->instance($cacheKey, $oneToOneMap);

        return $oneToOneMap;
    }
}
