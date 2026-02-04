<?php

namespace Feature\DataSource\Actions;

use App\Actions\DataSource\CreateMeetingDataSourceAction;
use App\Models\DataSource;
use App\Models\Meeting;
use Tests\TestCase;

class CreateMeetingDataSourceActionTest extends TestCase
{
    /**
     * @throws \Exception
     */
    public function test_it_creates_a_data_source_for_a_given_meeting()
    {
        $meeting        = Meeting::first();
        $path           = 'path/to/srt/file/sentences.srt';
        $pulseId        = '1e1405d9-4685-47dc-b743-8d3872e390a7';
        $organizationId = '9d83b6d2-debe-45f0-943d-275c5ff769cf';

        $action = app(CreateMeetingDataSourceAction::class);

        $dataSource = $action->handle(
            meeting: $meeting,
            organizationId: $organizationId,
            pulseId: $pulseId,
        );

        $this->assertInstanceOf(DataSource::class, $dataSource);

        $this->assertDatabaseHas(DataSource::class, [
            'description'     => $meeting->title,
            'name'            => $meeting->title,
            'organization_id' => $organizationId,
            'type'            => 'text',
            'pulse_id'        => $pulseId,
            'origin'          => 'meeting',
        ]);
    }
}
