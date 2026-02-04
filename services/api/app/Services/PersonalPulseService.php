<?php

declare(strict_types=1);

namespace App\Services;

use App\Actions\Pulse\CreatePulseAction;
use App\DataTransferObjects\Pulse\PulseData;
use App\Enums\PulseCategory;
use App\Models\Organization;
use App\Models\Pulse;
use App\Models\User;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\App;
use Illuminate\Support\Facades\Log;

class PersonalPulseService
{
    /**
     * Ensure the user has a personal pulse for the given organization.
     * Creates one if it doesn't exist.
     */
    public static function ensureUserHasPersonalPulse(User $user, string $organizationId): void
    {
        $hasPersonalPulse = Pulse::where('organization_id', $organizationId)
            ->where('category', PulseCategory::PERSONAL)
            ->whereHas('members', function ($query) use ($user) {
                $query->where('user_id', $user->id);
            })
            ->exists();

        if (! $hasPersonalPulse) {
            self::createPersonalPulse($user, $organizationId);
        }
    }

    /**
     * Create a personal pulse for the user in the given organization.
     */
    public static function createPersonalPulse(User $user, string $organizationId): void
    {
        try {
            $pulseName = "{$user->name}'s Personal Pulse";

            $pulseData = new PulseData(
                name: $pulseName,
                organizationId: $organizationId,
                category: PulseCategory::PERSONAL->value,
                userId: (string) $user->id,
            );

            $createPulseAction = App::make(CreatePulseAction::class);
            $createPulseAction->handle($pulseData);

            Log::info("PERSONAL pulse created for user {$user->id} in organization {$organizationId}");
        } catch (QueryException $e) {
            // Check if this is a unique constraint violation
            if (str_contains($e->getMessage(), 'pulse_members_personal_unique')) {
                Log::info("Personal pulse already exists for user {$user->id} in organization {$organizationId} - constraint prevented duplicate");
                return;
            }

            // Re-throw if it's a different error
            Log::error("Failed to create personal pulse for user {$user->id} in organization {$organizationId}: {$e->getMessage()}");
            throw $e;
        }
    }
}
