<?php

namespace App\Models;

use App\Enums\PulseMemberRole;
use App\Observers\PulseMemberObserver;
use Illuminate\Database\Eloquent\Attributes\ObservedBy;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Auth;
use App\Jobs\SyncPulseMemberNotificationsJob;

#[ObservedBy(PulseMemberObserver::class)]
class PulseMember extends BaseModel
{
    protected static array $oneToOneCache = [];

    protected $fillable = [
        'pulse_id',
        'user_id',
        'role',
        'job_description',
        'responsibilities',
        'last_visited',
        'order',
    ];

    protected $casts = [
        'responsibilities' => 'array',
        'role' => PulseMemberRole::class,
    ];

    public function scopeForPulse(Builder $query, string $pulseId): Builder
    {
        return $query->where('pulse_id', $pulseId);
    }

    protected static function booted()
    {
        static::created(function ($pulseMember) {
            SyncPulseMemberNotificationsJob::dispatch(
                $pulseMember->pulse_id,
                $pulseMember->user_id
            );
        });
    }

    public function pulse(): BelongsTo
    {
        return $this->belongsTo(Pulse::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function organizationUser(): BelongsTo
    {
        return $this->belongsTo(OrganizationUser::class, 'user_id', 'user_id');
    }

    public function organizationGroups()
    {
        return $this->belongsToMany(
            OrganizationGroup::class,
            'organization_group_pulse_member'
        )->withPivot('order');
    }

    public static function preloadOneToOnePulses($pulseMembers): void
    {
        $authUserId = Auth::id();
        if (!$authUserId) {
            return;
        }

        // Get all unique member user IDs (excluding auth user)
        $memberUserIds = $pulseMembers
            ->pluck('user_id')
            ->unique()
            ->reject(fn($id) => $id === $authUserId)
            ->values()
            ->all();

        if (empty($memberUserIds)) {
            return;
        }

        // Pre-populate cache with null for members not already cached to prevent N+1 fallback queries
        // This ensures array_key_exists returns true even for members without one-to-one pulses
        // Only set null if not already cached to preserve existing entries from previous calls
        foreach ($memberUserIds as $memberId) {
            $cacheKey = "{$authUserId}:{$memberId}";
            if (!array_key_exists($cacheKey, static::$oneToOneCache)) {
                static::$oneToOneCache[$cacheKey] = null;
            }
        }

        // Preload personal pulse for auth user (Case 1)
        $personalPulseId = Pulse::where('category', 'PERSONAL')
            ->whereHas('members', fn($q) => $q->where('user_id', $authUserId))
            ->first()?->id;

        // Cache the auth user's personal pulse lookup
        static::$oneToOneCache[
            "{$authUserId}:{$authUserId}"
        ] = $personalPulseId;

        // Batch fetch all one-to-one pulses where auth user is a member
        // Include count of other members to identify true 1:1 pulses (exactly 2 members total)
        $oneToOnePulses = Pulse::where('category', 'ONETOONE')
            ->whereHas('members', fn($q) => $q->where('user_id', $authUserId))
            ->withCount([
                'members as other_member_count' => fn($q) => $q->where(
                    'user_id',
                    '!=',
                    $authUserId
                ),
            ])
            ->with([
                'members' => fn($q) => $q->whereIn('user_id', $memberUserIds),
            ])
            ->get();

        // Build cache: for each one-to-one pulse, map the other member's user_id to the pulse_id
        // This overwrites the null entries for members who do have one-to-one pulses
        foreach ($oneToOnePulses as $pulse) {
            // Only consider pulses with exactly 1 other member (true 1:1)
            if ($pulse->other_member_count !== 1) {
                continue;
            }

            foreach ($pulse->members as $member) {
                if ($member->user_id !== $authUserId) {
                    static::$oneToOneCache["{$authUserId}:{$member->user_id}"] =
                        $pulse->id;
                }
            }
        }
    }

    /**
     * Clear the one-to-one cache (useful for testing).
     */
    public static function clearOneToOneCache(): void
    {
        static::$oneToOneCache = [];
    }

    public function getOneToOneAttribute(): ?string
    {
        $authUserId = Auth::id();
        $thisUserId = $this->user_id;

        // Case 1: This member belongs to the authenticated user
        if ($thisUserId === $authUserId) {
            $cacheKey = "{$authUserId}:{$authUserId}";
            // Use array_key_exists to properly handle null cached values (no personal pulse)
            if (array_key_exists($cacheKey, static::$oneToOneCache)) {
                return static::$oneToOneCache[$cacheKey] ?? $this->pulse_id;
            }

            // Fallback to database query if not preloaded
            $personalPulseId = Pulse::where('category', 'PERSONAL')
                ->whereHas(
                    'members',
                    fn($q) => $q->where('user_id', $authUserId)
                )
                ->first()?->id;

            // Cache the result for any subsequent calls
            static::$oneToOneCache[$cacheKey] = $personalPulseId;

            return $personalPulseId ?? $this->pulse_id;
        }

        // Case 2: Try to find a shared ONETOONE pulse between the two users
        $cacheKey = "{$authUserId}:{$thisUserId}";

        // Check cache first (populated by preloadOneToOnePulses)
        if (array_key_exists($cacheKey, static::$oneToOneCache)) {
            return static::$oneToOneCache[$cacheKey];
        }

        // Fallback to database query if not preloaded
        $userIds = [$authUserId, $thisUserId];

        $sharedOneToOnePulseId = Pulse::where('category', 'ONETOONE')
            ->whereHas(
                'members',
                fn($q) => $q->whereIn('user_id', $userIds),
                '=',
                2
            )
            ->first()?->id;

        // Cache the result for any subsequent calls
        static::$oneToOneCache[$cacheKey] = $sharedOneToOnePulseId;

        if ($sharedOneToOnePulseId) {
            return $sharedOneToOnePulseId;
        }

        return null;
    }

    public function isOwner(): bool
    {
        return $this->role === PulseMemberRole::OWNER;
    }

    public function isAdmin(): bool
    {
        return $this->role === PulseMemberRole::ADMIN;
    }

    /**
     * Convert the last_visited datetime from UTC to the user's timezone
     */
    public function getLastVisitedAttribute($value)
    {
        if (!$value) {
            return null;
        }

        $user = $this->user;

        $timezone = $user->timezone ?? 'UTC';

        return Carbon::parse($value)->setTimezone($timezone);
    }
}
