<?php

namespace App\Observers;

use App\Concerns\FeedHandler;
use App\Enums\FeedType;
use App\Models\PulseMember;
use App\Services\CacheService;
use Illuminate\Contracts\Events\ShouldHandleEventsAfterCommit;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class PulseMemberObserver implements ShouldHandleEventsAfterCommit
{
    use FeedHandler;

    /**
     * Handle the PulseMember "created" event.
     */
    public function created(PulseMember $pulseMember): void
    {
        $this->clearPulseMemberCaches($pulseMember);

        $user = Auth::user();

        if ($user) {
            $pulseMember->load(['pulse.members.user', 'user']);

            foreach ($pulseMember->pulse->members as $member) {
                $this->recordActivity(
                    model: $pulseMember,
                    properties: [
                        'data'   => $pulseMember->toArray(),
                        'causer' => $user->only([
                            'id',
                            'name',
                            'email',
                            'gravatar',
                        ]),
                    ],
                    description: 'Added ' .
                        $pulseMember->user->name .
                        ' to the ' .
                        $pulseMember->pulse->name,
                    feed_type: FeedType::PULSEMEMBER_ADDED->value,
                    organization_id: $pulseMember->pulse->organization_id,
                    receiver_id: $member->user->id,
                    pulse_id: $pulseMember->pulse_id,
                );
            }
        }
    }

    /**
     * Handle the PulseMember "updated" event.
     */
    public function updated(PulseMember $pulseMember): void
    {
        $this->clearPulseMemberCaches($pulseMember);
    }

    /**
     * Handle the PulseMember "deleted" event.
     */
    public function deleted(PulseMember $pulseMember): void
    {
        $this->clearPulseMemberCaches($pulseMember);
    }

    private function clearPulseMemberCaches(PulseMember $pulseMember): void
    {
        $userId = $pulseMember->user_id;
        $pulseId = $pulseMember->pulse_id;

        Cache::forget("user:{$userId}:pulse-ids");
        Cache::forget("user:{$userId}:organization-ids");

        CacheService::clearLighthouseCache('PulseMember', $pulseMember->id);
        CacheService::clearLighthouseCache('Pulse', $pulseId);
        CacheService::clearLighthouseCache('User', $userId);

        Log::debug('PulseMemberObserver: cleared caches', [
            'pulse_member_id' => $pulseMember->id,
            'user_id' => $userId,
            'pulse_id' => $pulseId,
        ]);
    }
}
