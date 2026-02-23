<?php

declare(strict_types=1);

namespace App\GraphQL\Mutations;

use App\Actions\RecurringEvent\CreateRecurringEventAction;
use App\DataTransferObjects\RecurringEventData;
use App\Models\Event;
use App\Models\RecurringEvent;
use GraphQL\Error\Error;
use Illuminate\Support\Facades\Auth;

final readonly class CreateRecurringEventMutation
{
    public function __construct(
        private CreateRecurringEventAction $createRecurringEventAction,
    ) {}

    public function __invoke(null $_, array $args): RecurringEvent
    {
        $user = Auth::user();

        if (! $user) {
            throw new Error('User not authenticated.');
        }

        $googleParentId = $args['google_parent_id'];

        // Verify the caller owns at least one event that belongs to this series.
        // This prevents arbitrary users from claiming or polluting recurring series records.
        $ownsEvent = Event::where('user_id', $user->id)
            ->where('google_event_id', 'like', $googleParentId . '%')
            ->exists();

        if (! $ownsEvent) {
            throw new Error('You do not have permission to create a recurring event for this series.');
        }

        $data = new RecurringEventData(
            google_parent_id: $googleParentId,
        );

        return $this->createRecurringEventAction->handle($data);
    }
}
