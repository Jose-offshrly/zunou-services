<?php

declare(strict_types=1);

namespace App\GraphQL\Mutations;

use App\Actions\Event\AttachGoogleMeetToEventAction;
use App\Models\Event;
use GraphQL\Error\Error;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

final readonly class AttachGoogleMeetToEventMutation
{
    public function __construct(
        private AttachGoogleMeetToEventAction $attachGoogleMeetToEventAction,
    ) {
    }

    /** @param  array{}  $args */
    public function __invoke(null $_, array $args)
    {
        try {
            $user = Auth::user();
            if (! $user) {
                throw new Error('No user was found');
            }

            $this->validateInput($args);

            $event = Event::find($args['eventId']);
            if (! $event) {
                throw new Error('Event not found');
            }

            // Check if user has permission to update this event
            if ($event->user_id !== $user->id) {
                throw new Error(
                    'You do not have permission to modify this event',
                );
            }

            return $this->attachGoogleMeetToEventAction->handle(
                event: $event,
                invite_pulse: $args['invite_pulse'] ?? false,
            );
        } catch (\RuntimeException $e) {
            throw new Error($e->getMessage());
        } catch (\Exception $e) {
            throw new Error(
                'Failed to attach Google Meet to event: ' . $e->getMessage(),
            );
        }
    }

    private function validateInput(array $input): void
    {
        $validator = Validator::make($input, [
            'eventId' => 'required|string|exists:events,id',
        ]);

        if ($validator->fails()) {
            throw new Error(
                'Validation failed: ' . $validator->errors()->first(),
            );
        }
    }
}
