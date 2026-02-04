<?php

declare(strict_types=1);

namespace App\GraphQL\Mutations;

use App\Actions\Event\CreateEventInstanceAction;
use App\DataTransferObjects\Calendar\EventInstanceData;
use GraphQL\Error\Error;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

final readonly class CreateEventInstanceMutation
{
    public function __construct(
        private CreateEventInstanceAction $createEventInstanceAction,
    ) {
    }

    public function __invoke(null $_, array $args)
    {
        try {
            $user = Auth::user();
            if (! $user) {
                throw new Error('No user was found');
            }

            $this->validateInput($args);

            $data = EventInstanceData::from($args);

            return $this->createEventInstanceAction->handle($data);
        } catch (\Exception $e) {
            throw new Error('Failed to create event instance: ' . $e->getMessage());
        }
    }

    private function validateInput(array &$input): void
    {
        // Normalize empty strings to null for optional fields
        if (isset($input['local_description']) && $input['local_description'] === '') {
            $input['local_description'] = null;
        }
        if (isset($input['priority']) && $input['priority'] === '') {
            $input['priority'] = null;
        }

        $validator = Validator::make($input, [
            'event_id'          => 'required|exists:events,id',
            'pulse_id'          => 'required|exists:pulses,id',
            'local_description' => 'nullable|string|max:1000',
            'priority'          => 'nullable|string|max:50',
        ]);

        if ($validator->fails()) {
            throw new Error(
                'Validation failed: ' . $validator->errors()->first(),
            );
        }
    }
}
