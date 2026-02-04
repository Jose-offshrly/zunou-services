<?php

namespace App\Actions\FireFlies;

use App\Models\User;

class StoreUserFireFliesNewMeetingAction
{
    public function __construct(
        private readonly FetchFireFliesTranscriptSentencesAction $fetchFireFliesTranscriptSentencesAction,
        private readonly StoreUserFireFliesTranscriptionAction $storeUserFireFliesTranscriptionAction,
    ) {
    }

    public function handle(User $user, string $meetingId, string $apiKey): void
    {
        foreach ($user->integrations as $integration) {
            if ($integration->api_key !== $apiKey) {
                continue;
            }

            $data = $this->fetchFireFliesTranscriptSentencesAction->handle(
                integration: $integration,
                meetingId: $meetingId,
            );

            $this->storeUserFireFliesTranscriptionAction->handle(
                transcriptions: collect([$data]),
                user: $user,
                pulseId: $integration->pulse_id,
            );
        }
    }
}
