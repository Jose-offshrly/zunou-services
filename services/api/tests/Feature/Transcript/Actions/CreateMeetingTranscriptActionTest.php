<?php

namespace Feature\Transcript\Actions;

use App\Actions\Transcript\CreateMeetingTranscriptAction;
use App\DataTransferObjects\TranscriptData;
use App\Models\DataSource;
use App\Models\Meeting;
use App\Models\Transcript;
use Tests\TestCase;

class CreateMeetingTranscriptActionTest extends TestCase
{
    public function test_it_creates_a_meeting_transcript_db_resource()
    {
        $meeting    = Meeting::first();
        $dataSource = DataSource::first();

        $data = new TranscriptData(
            content: $this->transcript(),
            meeting_id: $meeting->id,
            data_source_id: $dataSource->id,
        );

        $action = app(CreateMeetingTranscriptAction::class);

        $transcript = $action->handle($data);

        // Assert basic database record (excluding speakers as it's JSONB and needs special handling)
        $transcriptArray = $transcript->toArray();
        unset($transcriptArray['speakers']);
        $this->assertDatabaseHas('transcripts', $transcriptArray);

        $this->assertInstanceOf(Transcript::class, $transcript);
        $this->assertInstanceOf(DataSource::class, $transcript->dataSource);
        $this->assertInstanceOf(Meeting::class, $transcript->meeting);

        // Assert speakers structure
        $this->assertIsArray($transcript->speakers);
        $this->assertArrayHasKey('maps', $transcript->speakers);
        $this->assertArrayHasKey('speakers', $transcript->speakers);

        // Assert maps structure
        $this->assertIsArray($transcript->speakers['maps']);
        $this->assertCount(4, $transcript->speakers['maps']);
        $this->assertEquals('Jerico Pira', $transcript->speakers['maps']['A']);
        $this->assertEquals('Kyle Castillon', $transcript->speakers['maps']['B']);
        $this->assertEquals('Kyle Castillon', $transcript->speakers['maps']['C']);
        $this->assertEquals('Jerico Pira', $transcript->speakers['maps']['D']);

        // Assert speakers array
        $this->assertIsArray($transcript->speakers['speakers']);
        $this->assertCount(4, $transcript->speakers['speakers']);
        $this->assertContains('A', $transcript->speakers['speakers']);
        $this->assertContains('B', $transcript->speakers['speakers']);
        $this->assertContains('C', $transcript->speakers['speakers']);
        $this->assertContains('D', $transcript->speakers['speakers']);

        dd($transcript);

        // Assert speakers is stored correctly in database as JSONB
        $this->assertDatabaseHas('transcripts', [
            'id' => $transcript->id,
        ]);
        $dbTranscript = Transcript::find($transcript->id);
        $this->assertEquals($transcript->speakers, $dbTranscript->speakers);
    }

    public function test_it_extracts_ai_speaker_mapping_from_transcript_content()
    {
        $action = app(CreateMeetingTranscriptAction::class);
        $content = $this->transcript();

        $mapping = $action->extractSpeakerMapping($content);

        $this->assertIsArray($mapping);
        $this->assertArrayHasKey('maps', $mapping);
        $this->assertArrayHasKey('speakers', $mapping);

        // Assert maps structure
        $this->assertIsArray($mapping['maps']);
        $this->assertCount(4, $mapping['maps']);
        $this->assertEquals('Jerico Pira', $mapping['maps']['A']);
        $this->assertEquals('Kyle Castillon', $mapping['maps']['B']);
        $this->assertEquals('Kyle Castillon', $mapping['maps']['C']);
        $this->assertEquals('Jerico Pira', $mapping['maps']['D']);

        // Assert speakers array
        $this->assertIsArray($mapping['speakers']);
        $this->assertCount(4, $mapping['speakers']);
        $this->assertContains('A', $mapping['speakers']);
        $this->assertContains('B', $mapping['speakers']);
        $this->assertContains('C', $mapping['speakers']);
        $this->assertContains('D', $mapping['speakers']);
    }

    public function test_it_removes_ai_speaker_mapping_section_from_content()
    {
        $meeting    = Meeting::first();
        $dataSource = DataSource::first();

        $contentWithMapping = $this->transcript();

        $data = new TranscriptData(
            content: $contentWithMapping,
            meeting_id: $meeting->id,
            data_source_id: $dataSource->id,
        );

        $action = app(CreateMeetingTranscriptAction::class);

        $transcript = $action->handle($data);

        dd($transcript->content);

        // Assert that the AI Speaker Mapping section is removed from the stored content
        $this->assertStringNotContainsString('AI Speaker Mapping', $transcript->content);
        $this->assertStringNotContainsString('Speaker A → Kyle Castillon', $transcript->content);
        $this->assertStringNotContainsString('Speaker B → Michael Makiling', $transcript->content);
        $this->assertStringNotContainsString('Speaker C → Clarence Coronel', $transcript->content);
        $this->assertStringNotContainsString('Speaker D → Lui Aranes', $transcript->content);
        $this->assertStringNotContainsString('Speaker E → Sophie San Agustin', $transcript->content);

        // Assert that the rest of the content is preserved
        $this->assertStringContainsString('Meeting Transcript', $transcript->content);
        $this->assertStringContainsString('Title: Meeting Transcript', $transcript->content);
        $this->assertStringContainsString('Organizer: john@test.com', $transcript->content);
        $this->assertStringContainsString('### Transcript:', $transcript->content);
        $this->assertStringContainsString('John Doe: Hello, everyone.', $transcript->content);

        // Assert that speakers were extracted correctly
        $this->assertIsArray($transcript->speakers);
        $this->assertArrayHasKey('maps', $transcript->speakers);
        $this->assertArrayHasKey('speakers', $transcript->speakers);
        $this->assertCount(4, $transcript->speakers['maps']);
    }

    private function transcript(): string
    {
        return <<<EOT
Meeting Transcript
Title: Meeting Transcript
Organizer: john@test.com
Date: 2025-01-20 08:25:00
Duration: 3
Meeting Link: meeting_link_here
Transcript Link: transcript_url_here (Source: Fireflies)
Participants: John Doe, Jane Smith

### Transcript:
AI Speaker Mapping
- Speaker A → Jerico Pira
- Speaker B → Kyle Castillon
- Speaker C → Kyle Castillon
- Speaker D → Jerico Pira

John Doe: Hello, everyone.
Jane Smith: Welcome to the meeting

### Speakers:
- Jane Smith
- John Doe
EOT;
    }
}
