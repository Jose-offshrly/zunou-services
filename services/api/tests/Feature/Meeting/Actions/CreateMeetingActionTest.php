<?php

namespace Feature\Meeting\Actions;

use App\Actions\Meeting\CreateMeetingAction;
use App\DataTransferObjects\FileData;
use App\DataTransferObjects\MeetingData;
use App\Models\DataSource;
use App\Models\Meeting;
use App\Models\Pulse;
use App\Models\User;
use Tests\TestCase;

class CreateMeetingActionTest extends TestCase
{
    public function test_it_can_create_a_meeting_resource_with_transcript()
    {
        $pulse = Pulse::first();
        $user  = User::first();

        $data = new MeetingData(
            title: 'new meeting',
            pulse_id: $pulse->id,
            user_id: $user->id,
            date: now(),
            organizer: $user->email,
            transcript: 'meeting transcript',
            participants: 'participant1,participant2',
        );

        $action = app(CreateMeetingAction::class);

        $meeting = $action->handle(data: $data);

        $this->assertInstanceOf(Meeting::class, $meeting);
        $this->assertNotNull($meeting->transcript);
        $this->assertInstanceOf(DataSource::class, $meeting->dataSource);
        $this->assertNotEquals('{}', $meeting->dataSource->metadata);
    }

    public function test_it_can_create_a_meeting_resource_with_uploaded_file()
    {
        $fileData = new FileData(
            file_key: 'organizations/9d/83/b6/d2/debe-45f0-943d-275c5ff769cf/data-sources/eb/b0/cd/58/dceb-4b49-a9e9-cf79d55a5b5c/ebb0cd58-dceb-4b49-a9e9-cf79d55a5b5c.txt',
            file_name: 'ebb0cd58-dceb-4b49-a9e9-cf79d55a5b5c.txt',
        );

        $pulse = Pulse::first();
        $user  = User::first();

        $data = new MeetingData(
            title: 'new meeting',
            pulse_id: $pulse->id,
            user_id: $user->id,
            date: now(),
            organizer: $user->email,
            participants: 'participant1,participant2',
            fileData: $fileData,
        );

        $action = app(CreateMeetingAction::class);

        $meeting = $action->handle(data: $data);

        $this->assertInstanceOf(Meeting::class, $meeting);
        $this->assertNotNull($meeting->transcript);
        $this->assertInstanceOf(DataSource::class, $meeting->dataSource);
        $this->assertNotEquals('{}', $meeting->dataSource->metadata);
    }
}
