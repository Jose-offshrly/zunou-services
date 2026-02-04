<?php

namespace App\Actions\FireFlies;

use App\DataTransferObjects\FireFliesTranscriptData;
use App\DataTransferObjects\SentenceData;
use App\Exceptions\FireFliesApiException;
use App\Models\Integration;
use Illuminate\Support\Facades\Log;

class FetchFireFliesTranscriptSentencesAction
{
    /**
     * @throws FireFliesApiException
     */
    public function handle(
        Integration $integration,
        string $meetingId,
    ): FireFliesTranscriptData {
        try {
            $response = app(CallFireFliesApiAction::class)->handle(
                api_key: $integration->api_key,
                query: $this->query(),
                variables: ['transcriptId' => $meetingId],
            );

            // Check if the response is empty (error case)
            if (empty($response) || !isset($response['data']['transcript'])) {
                Log::error('FetchFireFliesTranscriptSentencesAction: Failed to fetch transcript', [
                    'meetingId' => $meetingId,
                    'response' => $response
                ]);
                
                throw new FireFliesApiException('Failed to fetch transcript data from FireFlies API');
            }

            $transcript = $response['data']['transcript'];

            $sentences = collect($transcript['sentences'])
                ->map(function ($sentence) {
                    return new SentenceData(
                        index: $sentence['index'],
                        speaker: $sentence['speaker_name'] ?? 'unknown',
                        raw_text: $sentence['raw_text'],
                        text: $sentence['text'],
                    );
                })
                ->toArray();

            return new FireFliesTranscriptData(
                id: $transcript['id'],
                title: $transcript['title'],
                organizer: $transcript['organizer_email'],
                date: $transcript['date'],
                duration: $transcript['duration'],
                meeting_link: $transcript['meeting_link'],
                transcript_url: $transcript['transcript_url'],
                participants: $transcript['participants'] ?? [],
                sentences: $sentences,
                speakers: $transcript['speakers'] ?? [],
            );
        } catch (\Exception $exception) {
            Log::info('Fire Flies: error fetching transcript', [
                'message' => $exception->getMessage(),
            ]);

            throw new FireFliesApiException($exception->getMessage());
        }
    }

    private function query(): string
    {
        return <<<'GRAPHQL'

query Transcript($transcriptId: String!) {
    transcript(id: $transcriptId) {
        id
        title
        organizer_email
        participants
        date
        duration
        meeting_link
        transcript_url
        sentences {
            index
            speaker_name
            speaker_id
            raw_text
            start_time
            end_time
            text
        }
        speakers {
            id
            name
        }
    }
}
GRAPHQL;
    }
}
