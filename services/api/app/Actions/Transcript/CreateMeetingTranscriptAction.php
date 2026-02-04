<?php

namespace App\Actions\Transcript;

use App\DataTransferObjects\TranscriptData;
use App\Models\Transcript;

class CreateMeetingTranscriptAction
{
    public function handle(TranscriptData $data): Transcript
    {
        $speakers = $this->extractSpeakerMapping($data->content);

        if (! is_array($speakers) || ! isset($speakers['maps']) || ! isset($speakers['speakers'])) {
            $speakers = [
                'maps'     => [],
                'speakers' => [],
            ];
        }

        if (! is_array($speakers['maps'])) {
            $speakers['maps'] = [];
        }
        if (! is_array($speakers['speakers'])) {
            $speakers['speakers'] = [];
        }

        $content = $this->removeSpeakerMappingSection($data->content);

        $transcript = Transcript::create([
            'meeting_id'     => $data->meeting_id,
            'data_source_id' => $data->data_source_id,
            'content'        => $content,
            'speakers'       => $speakers,
        ]);

        return $transcript->refresh();
    }
    public function extractSpeakerMapping(string $content): array
    {
        $maps     = [];
        $speakers = [];

        // Look for the AI Speaker Mapping section
        // Match both regular arrow (->) and Unicode arrow (→) using alternation
        // Use 'u' flag for proper Unicode character handling
        if (preg_match('/AI Speaker Mapping\s*\n((?:- Speaker [A-Z]\s*(?:→|->)\s*.+\n?)+)/iu', $content, $matches)) {
            $mappingSection = $matches[1];

            // Extract each speaker mapping line (match both arrow types using alternation)
            // Capture name until end of line or end of string
            if (preg_match_all('/- Speaker ([A-Z])\s*(?:→|->)\s*(.+?)(?:\n|$)/u', $mappingSection, $speakerMatches, PREG_SET_ORDER)) {
                foreach ($speakerMatches as $match) {
                    $letter = trim($match[1]);
                    $name   = trim($match[2]);
                    // Ensure both letter and name are non-empty strings
                    if (! empty($letter) && ! empty($name) && is_string($letter) && is_string($name)) {
                        $maps[$letter] = $name;
                        $speakers[]    = $letter;
                    }
                }
            }
        }

        return [
            'maps'     => $maps,
            'speakers' => $speakers,
        ];
    }

    private function removeSpeakerMappingSection(string $content): string
    {
        $pattern = '/\n?\s*AI Speaker Mapping\s*\n[\s\n]*(?:- Speaker [A-Z]\s*(?:→|->)\s*.+\s*\n[\s\n]*)*/iu';

        $content = preg_replace($pattern, '', $content);

        // Ensure newline after ### Transcript: if it's followed by non-whitespace content
        $content = preg_replace('/(### Transcript:)(\S)/u', "$1\n$2", $content);

        return $content;
    }
}
