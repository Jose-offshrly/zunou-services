<?php

namespace App\Actions\FireFlies;

use App\Actions\Shared\FormatUnixTimestampAction;
use App\Concerns\TemporaryFileHandler;
use App\DataTransferObjects\FireFliesTranscriptData;

class GenerateSummaryAction
{
    use TemporaryFileHandler;

    /**
     * returns the path of the temporary created summary file
     * @return array {0: TemporaryFileData, 1: string}
     */
    public function handle(
        FireFliesTranscriptData $transcript,
        string $dataSourceId,
    ): array {
        // Extract metadata from the transcript
        $title          = $transcript->title          ?? 'No Title';
        $organizer      = $transcript->organizer      ?? 'Unknown Organizer';
        $date           = $transcript->date           ?? 'Unknown Date';
        $duration       = $transcript->duration       ?? 'Unknown Duration';
        $meetingLink    = $transcript->meeting_link   ?? 'No Meeting Link';
        $transcriptLink = $transcript->transcript_url ?? 'No Transcript Link';
        $participants   = $transcript->participants
            ? implode(', ', $transcript->participants)
            : 'None listed';

        $date = app(FormatUnixTimestampAction::class)->handle($date);

        // Format metadata section
        $metadata = <<<EOT
$title
Title: $title
Organizer: $organizer
Date: $date
Duration: $duration
Meeting Link: $meetingLink
Transcript Link: $transcriptLink (Source: Fireflies)
Participants: $participants
EOT;

        // Map sentences to the desired format: "Speaker: Text"
        $transcriptContent = collect($transcript->sentences)
            ->map(function ($sentence) {
                $text    = $sentence->text;
                $speaker = $sentence->speaker ?? 'Unknown Speaker';

                return "{$speaker}: {$text}";
            })
            ->implode("\n");

        // Extract unique speakers for the speakers list
        $speakers = collect($transcript->speakers)
            ->pluck('name')
            ->unique()
            ->sort()
            ->map(fn ($name) => "- $name")
            ->implode("\n");

        // Combine all sections
        $summaryContent = <<<EOT
$metadata

### Transcript:
$transcriptContent

### Speakers:
$speakers
EOT;
        return [
            $this->storeTemporaryFile(
                dataSourceId: $dataSourceId,
                summaryContent: $summaryContent,
            ),
            $summaryContent,
        ];
    }
}
