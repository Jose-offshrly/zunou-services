<?php

declare(strict_types=1);

namespace App\GraphQL\Mutations;

use App\Models\MeetingSession;
use GraphQL\Error\Error;
use Illuminate\Support\Facades\Log;

readonly class CompanionWebhookMutation
{
    public function __invoke($_, array $args): MeetingSession
    {
        try {
            Log::info('CompanionWebhook called', [
                'meetingSessionId' => $args['input']['meetingSessionId'],
                'companionStatus'  => $args['input']['companionStatus'],
            ]);

            $meetingSession = MeetingSession::find(
                $args['input']['meetingSessionId'],
            );

            if (! $meetingSession) {
                Log::error('Meeting session not found', [
                    'meetingSessionId' => $args['input']['meetingSessionId'],
                ]);
                throw new Error('Meeting session not found');
            }

            // Update the companion status if provided
            if (isset($args['input']['companionStatus'])) {
                $meetingSession->update([
                    'companion_status' => $args['input']['companionStatus'],
                ]);

                Log::info('Meeting session companion status updated', [
                    'meetingSessionId' => $meetingSession->id,
                    'companionStatus'  => $args['input']['companionStatus'],
                ]);
            }

            return $meetingSession->refresh();
        } catch (\Exception $e) {
            Log::error('CompanionWebhook error: ' . $e->getMessage(), [
                'meetingSessionId' => $args['input']['meetingSessionId'] ?? null,
                'companionStatus'  => $args['input']['companionStatus']   ?? null,
                'error'            => $e->getMessage(),
                'trace'            => $e->getTraceAsString(),
            ]);

            throw new Error(
                'Failed to process companion webhook: ' . $e->getMessage(),
            );
        }
    }
}
