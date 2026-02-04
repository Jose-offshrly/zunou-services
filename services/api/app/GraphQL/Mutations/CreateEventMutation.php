<?php

declare(strict_types=1);

namespace App\GraphQL\Mutations;

use App\Actions\Event\CreateEventAction;
use App\DataTransferObjects\ScheduledEventData;
use GraphQL\Error\Error;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

final readonly class CreateEventMutation
{
    public function __construct(private CreateEventAction $createEventAction)
    {
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

            $data = ScheduledEventData::from([
                ...$args,
                'start_at'     => Carbon::parse($args['start_at']),
                'end_at'       => Carbon::parse($args['end_at']),
                'invite_pulse' => $args['invite_pulse'] ?? false,
            ]);

            $event = $this->createEventAction->handle(data: $data);

            return $event;
        } catch (\Exception $e) {
            throw new Error('Failed to create event: '.$e->getMessage());
        }
    }

    private function validateInput(array &$input): void
    {
        // Normalize empty strings to null for description
        if (isset($input['description']) && $input['description'] === '') {
            $input['description'] = null;
        }

        $validator = Validator::make($input, [
            'name'            => 'required|string|max:255',
            'date'            => 'required|date',
            'start_at'        => 'required|date',
            'end_at'          => 'required|date',
            'location'        => 'nullable|string|max:255',
            'priority'        => 'nullable|string|max:50',
            'attendees'       => 'nullable|array',
            'summary'         => 'nullable|string',
            'description'     => 'nullable|string|max:1000',
            'files'           => 'nullable|array',
            'pulse_id'        => 'required|exists:pulses,id',
            'organization_id' => 'required|exists:organizations,id',
            'user_id'         => 'required|exists:users,id',
            'invite_pulse'    => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            throw new Error(
                'Validation failed: '.$validator->errors()->first(),
            );
        }
    }
}
