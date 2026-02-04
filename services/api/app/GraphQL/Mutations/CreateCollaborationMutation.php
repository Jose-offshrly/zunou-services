<?php

namespace App\GraphQL\Mutations;

use App\Actions\Collaboration\CreateCollaborationAction;
use App\DataTransferObjects\EventData;
use App\Enums\MeetingType;
use App\Models\Collaboration;
use GraphQL\Error\Error;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Auth;

readonly class CreateCollaborationMutation
{
    public function __construct(
        protected CreateCollaborationAction $createCollaborationAction,
    ) {
    }

    public function __invoke($_, array $args): Collaboration
    {
        try {
            $user = Auth::user();
            if (! $user) {
                throw new Error('no user found!');
            }

            $data = new EventData(
                name: $args['name'],
                description: $args['description'],
                start_at: Carbon::now(),
                end_at: Carbon::now()->addHour(),
                attendees: $args['attendees'],
                external_attendees: $args['external_attendees'] ?? null,
                meeting_type: isset($args['meeting_type']) ? MeetingType::fromName($args['meeting_type']) : null,
            );

            $collab = $this->createCollaborationAction->handle(
                data: $data,
                pulse_id: $args['pulseId'],
                organization_id: $args['organizationId'],
                user_id: $user->id,
                invite_pulse: $args['invite_pulse'] ?? false,
            );

            return $collab;
        } catch (\Exception $e) {
            throw new Error(
                'Failed to create a pulse collaboration: ' . $e->getMessage(),
            );
        }
    }
}
