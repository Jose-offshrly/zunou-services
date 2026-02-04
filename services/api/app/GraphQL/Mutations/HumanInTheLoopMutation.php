<?php

declare(strict_types=1);

namespace App\GraphQL\Mutations;

use App\Actions\Meeting\UpdateSpeakerLabelsAction;
use GraphQL\Error\Error;
use Illuminate\Support\Facades\Log;

final class HumanInTheLoopMutation
{
    public function __construct(
        private readonly UpdateSpeakerLabelsAction $updateSpeakerLabelsAction,
    ) {
    }

    public function __invoke($_, array $args): bool
    {
        try {
            // Log all args first to debug
            Log::info('HumanInTheLoop mutation called with args:', [
                'all_args'  => $args,
                'args_keys' => array_keys($args),
            ]);

            // Safely access arguments - try both snake_case and the exact key
            $botMeetingId = $args['bot_meeting_id'] ?? $args['botMeetingId'] ?? null;
            $transcriptId = $args['transcript_id']  ?? $args['transcriptId'] ?? null;
            $maps         = $args['maps']           ?? null;

            Log::info('HumanInTheLoop mutation processing', [
                'bot_meeting_id' => $botMeetingId,
                'transcript_id'  => $transcriptId,
                'maps'           => $maps,
            ]);

            return $this->updateSpeakerLabelsAction->handle($botMeetingId, $maps, $transcriptId);
        } catch (\Exception $e) {
            Log::error('HumanInTheLoop mutation failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'args'  => $args,
            ]);

            throw new Error('Failed to process human-in-the-loop mapping: '.$e->getMessage());
        }
    }
}
