<?php

declare(strict_types=1);

namespace App\GraphQL\Mutations;

use App\Actions\CreateSmartChecklistAction;
use GraphQL\Error\Error;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

final class CreateSmartChecklistMutation
{
    public function __construct(
        private readonly CreateSmartChecklistAction $createSmartChecklistAction,
    ) {
    }

    public function __invoke($_, array $args): Collection
    {
        try {
            $user = Auth::user();
            if (! $user) {
                throw new Error('No user was found');
            }

            $this->validateInput($args);

            $checklist = $this->createSmartChecklistAction->handle(
                pulseId: $args['pulse_id'],
                organizationId: $args['organization_id'],
                eventId: $args['event_id'] ?? null,
                eventInstanceId: $args['event_instance_id'] ?? null,
            );

            return $checklist;
        } catch (\Exception $e) {
            throw new Error(
                'Failed to create smart checklist: ' . $e->getMessage(),
            );
        }
    }

    private function validateInput(array $input): void
    {
        $validator = Validator::make($input, [
            'pulse_id'        => 'required|exists:pulses,id',
            'organization_id' => 'required|exists:organizations,id',
            'event_id'        => 'nullable|exists:events,id',
            'event_instance_id' => 'nullable|exists:event_instances,id',
        ]);

        if ($validator->fails()) {
            throw new Error(
                'Validation failed: ' . $validator->errors()->first(),
            );
        }
    }
}
