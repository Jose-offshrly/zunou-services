<?php

declare(strict_types=1);

namespace Tests\Feature\Meeting\Actions;

use App\Actions\Meeting\UpdateSpeakerLabelsAction;
use GraphQL\Error\Error;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class UpdateSpeakerLabelsActionTest extends TestCase
{
    private UpdateSpeakerLabelsAction $action;

    protected function setUp(): void
    {
        parent::setUp();

        $this->action = app(UpdateSpeakerLabelsAction::class);
    }

    public function test_it_can_update_speaker_labels_successfully(): void
    {
        // Arrange
        $botMeetingId = 'meeting-123';
        $maps = [
            [
                'speaker'   => 'A',
                'user_name' => 'John Doe',
            ],
            [
                'speaker'   => 'B',
                'user_name' => 'Jane Smith',
            ],
        ];

        $expectedPayload = [
            'meeting_id'      => $botMeetingId,
            'speaker_mapping' => [
                'A' => 'John Doe',
                'B' => 'Jane Smith',
            ],
        ];

        Http::fake([
            config('zunou.companion.update_speaker_label_url') => Http::response(
                [
                    'code' => 200,
                    'message' => 'Speaker labels updated successfully',
                ],
                200,
            ),
        ]);

        // Act
        $result = $this->action->handle($botMeetingId, $maps);


        // Assert
        $this->assertTrue($result);

        Http::assertSent(function ($request) use ($expectedPayload) {
            return $request->url() === config('zunou.companion.update_speaker_label_url')
                && $request->method() === 'POST'
                && $request->header('Content-Type')[0] === 'application/json'
                && $request->data() === $expectedPayload;
        });
    }

    public function test_it_throws_error_when_bot_meeting_id_is_empty(): void
    {
        // Arrange
        $botMeetingId = '';
        $maps = [
            [
                'speaker'   => 'A',
                'user_name' => 'John Doe',
            ],
        ];

        // Act & Assert
        $this->expectException(Error::class);
        $this->expectExceptionMessage('bot_meeting_id is required');

        $this->action->handle($botMeetingId, $maps);
    }

    public function test_it_throws_error_when_bot_meeting_id_is_null(): void
    {
        // Arrange
        $botMeetingId = null;
        $maps = [
            [
                'speaker'   => 'A',
                'user_name' => 'John Doe',
            ],
        ];

        // Act & Assert
        $this->expectException(Error::class);
        $this->expectExceptionMessage('bot_meeting_id is required');

        $this->action->handle($botMeetingId, $maps);
    }

    public function test_it_throws_error_when_maps_is_empty(): void
    {
        // Arrange
        $botMeetingId = 'meeting-123';
        $maps = [];

        // Act & Assert
        $this->expectException(Error::class);
        $this->expectExceptionMessage('maps is required and must be an array');

        $this->action->handle($botMeetingId, $maps);
    }

    public function test_it_throws_error_when_no_valid_speaker_mappings_found(): void
    {
        // Arrange
        $botMeetingId = 'meeting-123';
        $maps = [
            [
                'speaker' => '',
                'user_name' => 'John Doe',
            ],
            [
                'speaker' => 'B',
                'user_name' => '',
            ],
        ];

        // Act & Assert
        $this->expectException(Error::class);
        $this->expectExceptionMessage('No valid speaker mappings found');

        $this->action->handle($botMeetingId, $maps);
    }

    public function test_it_skips_invalid_map_entries(): void
    {
        // Arrange
        $botMeetingId = 'meeting-123';
        $maps = [
            [
                'speaker'   => 'A',
                'user_name' => 'John Doe',
            ],
            [
                // Missing speaker key
                'user_name' => 'Jane Smith',
            ],
            [
                'speaker' => 'B',
                // Missing user_name key
            ],
            [
                'speaker'   => 'C',
                'user_name' => 'Bob Johnson',
            ],
        ];

        $expectedPayload = [
            'meeting_id'      => $botMeetingId,
            'speaker_mapping' => [
                'A' => 'John Doe',
                'C' => 'Bob Johnson',
            ],
        ];

        Http::fake([
            config('zunou.companion.update_speaker_label_url') => Http::response(
                [
                    'code' => 200,
                    'message' => 'Speaker labels updated successfully',
                ],
                200,
            ),
        ]);

        // Act
        $result = $this->action->handle($botMeetingId, $maps);

        // Assert
        $this->assertTrue($result);

        Http::assertSent(function ($request) use ($expectedPayload) {
            return $request->data() === $expectedPayload;
        });
    }

    public function test_it_handles_whitespace_in_speaker_and_user_name(): void
    {
        // Arrange
        $botMeetingId = 'meeting-123';
        $maps = [
            [
                'speaker'   => '  A  ',
                'user_name' => '  John Doe  ',
            ],
        ];

        $expectedPayload = [
            'meeting_id'      => $botMeetingId,
            'speaker_mapping' => [
                'A' => 'John Doe',
            ],
        ];

        Http::fake([
            config('zunou.companion.update_speaker_label_url') => Http::response(
                [
                    'code' => 200,
                    'message' => 'Speaker labels updated successfully',
                ],
                200,
            ),
        ]);

        // Act
        $result = $this->action->handle($botMeetingId, $maps);

        // Assert
        $this->assertTrue($result);

        Http::assertSent(function ($request) use ($expectedPayload) {
            return $request->data() === $expectedPayload;
        });
    }

    public function test_it_throws_error_when_http_request_fails(): void
    {
        // Arrange
        $botMeetingId = 'meeting-123';
        $maps = [
            [
                'speaker'   => 'A',
                'user_name' => 'John Doe',
            ],
        ];

        Http::fake([
            config('zunou.companion.update_speaker_label_url') => Http::response(
                [
                    'code' => 500,
                    'message' => 'Internal server error',
                ],
                500,
            ),
        ]);

        // Act & Assert
        $this->expectException(Error::class);
        $this->expectExceptionMessage('Failed to update speaker labels:');

        $this->action->handle($botMeetingId, $maps);
    }

    public function test_it_handles_multiple_speakers_with_same_user_name(): void
    {
        // Arrange
        $botMeetingId = 'meeting-123';
        $maps = [
            [
                'speaker'   => 'A',
                'user_name' => 'John Doe',
            ],
            [
                'speaker'   => 'B',
                'user_name' => 'John Doe',
            ],
        ];

        $expectedPayload = [
            'meeting_id'      => $botMeetingId,
            'speaker_mapping' => [
                'A' => 'John Doe',
                'B' => 'John Doe',
            ],
        ];

        Http::fake([
            config('zunou.companion.update_speaker_label_url') => Http::response(
                [
                    'code' => 200,
                    'message' => 'Speaker labels updated successfully',
                ],
                200,
            ),
        ]);

        // Act
        $result = $this->action->handle($botMeetingId, $maps);

        // Assert
        $this->assertTrue($result);

        Http::assertSent(function ($request) use ($expectedPayload) {
            return $request->data() === $expectedPayload;
        });
    }
}

