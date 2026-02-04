<?php

namespace Feature\FireFlies\Actions;

use App\Actions\FireFlies\FetchFireFliesTranscriptSentencesAction;
use App\DataTransferObjects\FireFliesTranscriptData;
use App\DataTransferObjects\SentenceData;
use App\Exceptions\FireFliesApiException;
use App\Models\Integration;
use App\Models\Meeting;
use Tests\TestCase;

class FetchFireFliesTranscriptSentencesActionTest extends TestCase
{
    /**
     * @throws FireFliesApiException
     */
    public function test_it_fetches_transcript_sentences_from_fire_flies()
    {
        $meeting     = Meeting::first();
        $integration = Integration::first();

        $action = app(FetchFireFliesTranscriptSentencesAction::class);

        $transcript = $action->handle(
            integration: $integration,
            meetingId: $meeting->meeting_id,
        );

        $this->assertInstanceOf(FireFliesTranscriptData::class, $transcript);
        $this->assertContainsOnlyInstancesOf(
            SentenceData::class,
            $transcript->sentences,
        );
        $this->assertContainsOnly('array', $transcript->speakers);
        $this->assertIsArray($transcript->participants);
    }
}
