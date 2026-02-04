<?php

namespace App\Services\Personalization\Traits;

use App\Models\PersonalizationContext;
use App\Models\Pulse;
use App\Models\User;
use Illuminate\Support\Facades\Log;

trait PersonalizationContextManager
{
    public function createPersonalizationContext(User $user, string $context, int $expirationDays, Pulse $pulse): PersonalizationContext
    {
        try {
            return PersonalizationContext::updateOrCreate(
                [
                    'user_id' => $user->id,
                    'source_id' => $this->personalizationSource?->id,
                ],
                [
                    'category' => static::NAME,
                    'context' => $context,
                    'expires_at' => now()->addDays(max(1, min(365, $expirationDays))),
                    'pulse_id' => $pulse->id,
                ]
            );
        } catch (\Exception $e) {
            Log::error('Failed to create PersonalizationContext', [
                'user_id' => $user->id,
                'category' => static::NAME,
                'error' => $e->getMessage(),
            ]);
            throw $e;
        }
    }
}