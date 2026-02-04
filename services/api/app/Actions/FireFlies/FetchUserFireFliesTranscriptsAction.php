<?php

namespace App\Actions\FireFlies;

use App\DataTransferObjects\FireFliesTranscriptData;
use App\DataTransferObjects\FireFliesUserData;
use GraphQL\Error\Error;
use Illuminate\Support\Collection;

class FetchUserFireFliesTranscriptsAction
{
    /**
     * Fetch user FireFlies transcripts with error handling
     */
    public function handle(
        string $api_key,
        FireFliesUserData $fireFliesUser,
    ): Collection {
        $response = app(CallFireFliesApiAction::class)->handle(
            api_key: $api_key,
            query: $this->query(),
            variables: [
                'userId' => $fireFliesUser->user_id,
            ],
        );

        // Check if the response is empty (error case)
        if (empty($response) || ! isset($response['data']['transcripts'])) {
            throw new Error('Failed to fetch Fireflies transcripts');
        }

        return collect($response['data']['transcripts'])
            ->filter(fn ($transcript) => isset($transcript['sentences'])) // Remove items where 'sentences' is not set
            ->map(
                fn ($transcript) => new FireFliesTranscriptData(
                    id: $transcript['id'],
                    title: $transcript['title'],
                    organizer: $transcript['organizer_email'],
                    date: $transcript['date'],
                    duration: $transcript['duration'],
                    meeting_link: $transcript['meeting_link'],
                    transcript_url: $transcript['transcript_url'],
                ),
            );
    }

    private function query(): string
    {
        return <<<'GRAPHQL'
    query Transcripts(
        $userId: String!
    ) {
        transcripts(
            user_id: $userId
        ) {
           id
        title
        organizer_email
        participants
        date
        duration
        meeting_link
        transcript_url
        sentences {
            speaker_name
            text
            }
        }
    }
GRAPHQL;
    }
}
