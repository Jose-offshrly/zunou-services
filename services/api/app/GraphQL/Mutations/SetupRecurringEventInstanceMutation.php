<?php

declare(strict_types=1);

namespace App\GraphQL\Mutations;

use App\Actions\RecurringEvent\SetupRecurringEventInstanceAction;
use App\DataTransferObjects\RecurringEventInstanceSetupData;
use App\Models\RecurringEventInstanceSetup;
use GraphQL\Error\Error;
use Illuminate\Support\Facades\Auth;

final readonly class SetupRecurringEventInstanceMutation
{
    public function __construct(
        private SetupRecurringEventInstanceAction $setupAction,
    ) {}

    public function __invoke(null $_, array $args): RecurringEventInstanceSetup
    {
        $user = Auth::user();

        if (! $user) {
            throw new Error('User not authenticated.');
        }

        $data = new RecurringEventInstanceSetupData(
            recurring_event_id: $args['recurring_event_id'],
            pulse_id: $args['pulse_id'],
            invite_notetaker: $args['invite_notetaker'],
            setting: $args['setting'] ?? null,
        );

        return $this->setupAction->handle($data);
    }
}
