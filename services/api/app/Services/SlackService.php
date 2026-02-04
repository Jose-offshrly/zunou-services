<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SlackService
{
    public function sendMessage(string $channelId, string $text): bool
    {
        $response = Http::withToken(config('services.slack.token'))
            ->post('https://slack.com/api/chat.postMessage', [
                'channel' => $channelId,
                'text' => $text,
            ]);

        if (!$response->ok() || !$response->json('ok')) {
            Log::error('Failed to send Slack message', [
                'channel' => $channelId,
                'text' => $text,
                'response' => $response->json(),
            ]);
            return false;
        }

        return true;
    }
}
