<?php

namespace App\Observers;

use App\Actions\Hiatus\CreateHiatusAction;
use App\DataTransferObjects\HiatusData;
use App\Enums\UserPresence;
use App\Events\UserPresenceChanged;
use App\Models\OrganizationUser;
use App\Models\Timesheet;
use App\Models\User;
use App\Services\CacheService;
use App\Services\PersonalPulseService;
use Illuminate\Contracts\Events\ShouldHandleEventsAfterCommit;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class UserObserver implements ShouldHandleEventsAfterCommit
{
    /**
     * Handle the User "updated" event.
     */
    public function updated(User $user): void
    {
        Log::info('User update here...');

        // Clear user-related caches
        $this->clearUserCaches($user);

        // Broadcast presence change if the presence attribute was changed
        if ($user->wasChanged('presence')) {
            broadcast(
                new UserPresenceChanged($user->id, $user->presence->value),
            );
        }
        if ($user->presence === UserPresence::hiatus) {
            $timesheet = TimeSheet::query()
                ->where('user_id', $user->id)
                ->whereNull('checked_out_at')
                ->latest()
                ->first();

            $data = new HiatusData(
                user_id: $user->id,
                timesheet_id: $timesheet->id,
            );

            $action = app(CreateHiatusAction::class);

            $action->handle($data);
        }
    }

    /**
     * Handle the User "created" event.
     */
    public function created(User $user): void
    {
        // Get the user's first organization (if any)
        $organizationUser = OrganizationUser::where(
            'user_id',
            $user->id,
        )->first();
        if (! $organizationUser) {
            Log::info(
                "No organization found for user {$user->id}, skipping PERSONAL pulse creation.",
            );

            return;
        }

        PersonalPulseService::createPersonalPulse(
            $user,
            $organizationUser->organization_id,
        );
    }

    /**
     * Handle the User "deleted" event.
     */
    public function deleted(User $user): void
    {
        $this->clearUserCaches($user);
    }

    /**
     * Handle the User "restored" event.
     */
    public function restored(User $user): void
    {
        $this->clearUserCaches($user);
    }

    private function clearUserCaches(User $user): void
    {
        Cache::forget("user:{$user->id}:organization-ids");
        Cache::forget("user:{$user->id}:pulse-ids");
        Cache::forget("pinned_organization_user_ids_{$user->id}");

        CacheService::clearLighthouseCache('User', $user->id);

        Log::debug('UserObserver: cleared caches', ['user_id' => $user->id]);
    }
}
