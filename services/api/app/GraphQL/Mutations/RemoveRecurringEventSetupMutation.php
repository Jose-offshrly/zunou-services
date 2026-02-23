<?php

declare(strict_types=1);

namespace App\GraphQL\Mutations;

use App\Models\RecurringEventInstanceSetup;
use GraphQL\Error\Error;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

final readonly class RemoveRecurringEventSetupMutation
{
    public function __invoke(null $_, array $args): bool
    {
        $user = Auth::user();

        if (! $user) {
            throw new Error('User not authenticated.');
        }

        $setup = RecurringEventInstanceSetup::find($args['setupId']);

        if (! $setup) {
            throw new Error('Recurring event instance setup not found.');
        }

        Log::info('Removing recurring event setup', [
            'setup_id'           => $setup->id,
            'recurring_event_id' => $setup->recurring_event_id,
            'pulse_id'           => $setup->pulse_id,
        ]);

        return $setup->delete();
    }
}
