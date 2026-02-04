<?php

declare(strict_types=1);

namespace App\Concerns;

use App\Actions\Transcript\CreateMeetingTranscriptAction;
use App\DataTransferObjects\MeetingData;
use App\DataTransferObjects\TranscriptData;

trait TranscriptHandler
{
    public function __construct(
        private readonly CreateMeetingTranscriptAction $createMeetingTranscriptAction,
    ) {
    }

    public function createTranscript(
        string $content,
        string $meeting_id,
        string $data_source_id,
    ): void {
        $transcriptData = new TranscriptData(
            content: $content,
            meeting_id: $meeting_id,
            data_source_id: $data_source_id,
        );

        $this->createMeetingTranscriptAction->handle($transcriptData);
    }

    public function generateTranscript(MeetingData $data): string
    {
        // Clean up the transcript
        $transcript = $data->transcript;

        // Remove "sponsored by ..." lines
        $transcript = preg_replace('/^.*sponsored by.*\n?/im', '', $transcript);

        // Remove lines with repeated words (anywhere in the line)
        $transcript = implode(
            "\n",
            array_filter(preg_split('/\r\n|\r|\n/', $transcript), function (
                $line,
            ) {
                // Remove lines with consecutive repeated words (e.g., "the the")
                return ! preg_match('/\b(\w+)\s+\1\b/i', strtolower($line));
            }),
        );

        // Return the formatted string with cleaned transcript
        return <<<EOT
$data->title
Title: $data->title
Organizer: $data->organizer
Date: $data->date
Participants: $data->participants

### Transcript:
$transcript
EOT;
    }
}
