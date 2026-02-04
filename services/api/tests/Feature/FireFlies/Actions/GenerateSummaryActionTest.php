<?php

namespace Feature\FireFlies\Actions;

use App\Actions\FireFlies\GenerateSummaryAction;
use App\DataTransferObjects\FireFliesTranscriptData;
use App\DataTransferObjects\SentenceData;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class GenerateSummaryActionTest extends TestCase
{
    /**
     * @throws \Exception
     */
    public function test_it_generates_an_srt_file_for_the_supplied_transcript()
    {
        $transcript = new FireFliesTranscriptData(
            id: '12345',
            title: 'Meeting Transcript',
            organizer: 'john@test.com',
            date: '1737361500000',
            duration: '3',
            meeting_link: 'meeting_link_here',
            transcript_url: 'transcript_url_here',
            participants: ['John Doe', 'Jane Smith'],
            sentences: [
                new SentenceData(
                    index: 0,
                    speaker: 'John Doe',
                    raw_text: 'Hello, everyone',
                    text: 'Hello, everyone.',
                ),
                new SentenceData(
                    index: 1,
                    speaker: 'Jane Smith',
                    raw_text: 'Welcome to the meeting',
                    text: 'Welcome to the meeting',
                ),
            ],
            speakers: [
                [
                    'id'   => 0,
                    'name' => 'John Doe',
                ],
                [
                    'id'   => 0,
                    'name' => 'Jane Smith',
                ],
            ],
        );

        $summary = app(GenerateSummaryAction::class)->handle(
            transcript: $transcript,
            dataSourceId: 'data_source_id',
        );

        Storage::disk('local')->assertExists('tmp/data_source_id.txt');

        $expectedContent = <<<EOT
Meeting Transcript
Title: Meeting Transcript
Organizer: john@test.com
Date: 2025-01-20 08:25:00
Duration: 3
Meeting Link: meeting_link_here
Transcript Link: transcript_url_here (Source: Fireflies)
Participants: John Doe, Jane Smith

### Transcript:
John Doe: Hello, everyone.
Jane Smith: Welcome to the meeting

### Speakers:
- Jane Smith
- John Doe
EOT;

        $this->assertEquals(
            $expectedContent,
            Storage::disk('local')->get('tmp/data_source_id.txt'),
        );

        $this->assertIsArray($summary);
    }
}
