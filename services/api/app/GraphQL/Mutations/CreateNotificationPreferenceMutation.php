<?php

declare(strict_types=1);

namespace App\GraphQL\Mutations;

use App\Enums\NotificationPreferenceMode;
use App\Enums\NotificationPreferenceScopeType;
use App\Models\NotificationPreference;
use GraphQL\Error\Error;
use Illuminate\Support\Facades\Auth;

final readonly class CreateNotificationPreferenceMutation
{
    public function __invoke($_, array $args): NotificationPreference
    {
        try {
            $user = Auth::user();
            if (! $user) {
                throw new Error('No authenticated user found.');
            }

            $input = $args['input'];

            // Validate scope_id is provided when scope_type is not global
            $scopeType = NotificationPreferenceScopeType::from($input['scopeType']);
            if ($scopeType !== NotificationPreferenceScopeType::global && empty($input['scopeId'])) {
                throw new Error('scopeId is required when scopeType is not global.');
            }

            // Validate scope_id is null when scope_type is global
            if ($scopeType === NotificationPreferenceScopeType::global && ! empty($input['scopeId'])) {
                throw new Error('scopeId must be null when scopeType is global.');
            }

            // Convert empty string to null for proper NULL handling in PostgreSQL
            $scopeId = ! empty($input['scopeId']) ? $input['scopeId'] : null;

            // Build query to find existing preference by user_id and scope_id only
            $query = NotificationPreference::where('user_id', $user->id);

            if ($scopeId === null) {
                $query->whereNull('scope_id');
            } else {
                $query->where('scope_id', $scopeId);
            }

            $preference = $query->first();

            if ($preference) {
                // Update existing preference (including scope_type if changed)
                $preference->update([
                    'scope_type' => $scopeType,
                    'mode'       => NotificationPreferenceMode::from($input['mode']),
                ]);
            } else {
                // Create new preference
                $preference = NotificationPreference::create([
                    'user_id'    => $user->id,
                    'scope_type' => $scopeType,
                    'scope_id'   => $scopeId,
                    'mode'       => NotificationPreferenceMode::from($input['mode']),
                ]);
            }

            return $preference->refresh();
        } catch (\Exception $e) {
            throw new Error('Failed to create notification preference: ' . $e->getMessage());
        }
    }
}
