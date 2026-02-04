<?php

namespace App\GraphQL\Mutations;

use App\Actions\DataSource\CreateMeetingDataSourceAction;
use App\Jobs\ProcessMeetingJob;
use App\Models\DataSource;
use App\Models\Integration;
use App\Models\Meeting;
use GraphQL\Error\Error;

final readonly class CreateMeetingDataSourceMutation
{
    public function __construct(
        private CreateMeetingDataSourceAction $createMeetingDataSourceAction,
    ) {
    }

    /**
     * @throws Error
     * @throws \Exception
     */
    public function __invoke($_, array $args): DataSource
    {
        $user = auth()->user();
        if (! $user) {
            throw new Error('No user was found');
        }

        $meeting = $this->findMeetingResource($args['meetingId']);

        $integration = Integration::findOrFail($args['integrationId']);

        if (! isset($meeting->data_source_id)) {
            $dataSource = $this->createMeetingDataSourceAction->handle(
                meeting: $meeting,
                organizationId: $args['organizationId'],
                pulseId: $meeting->pulse_id,
            );

            // Dispatch the job to the queue
            ProcessMeetingJob::dispatch(
                integration: $integration,
                meeting: $meeting,
                dataSource: $dataSource,
                organizationId: $args['organizationId'],
            );

            return $dataSource->refresh();
        }

        return $meeting->dataSource->refresh();
    }

    private function findMeetingResource(string $meetingId): Meeting
    {
        $meeting         = Meeting::findOrFail($meetingId);
        $meeting->status = 'added';
        $meeting->save();
        return $meeting->refresh();
    }
}
