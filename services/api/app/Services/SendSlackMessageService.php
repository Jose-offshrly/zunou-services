<?php

namespace App\Services;

use App\Models\Organization;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SendSlackMessageService
{
    public static function perform(
        Organization $organization,
        string $channelId,
        string $message,
    ) {
        if (! $organization->slack_access_token) {
            throw new \Exception(
                'Organization ' . $organization->id . 'has no Slack token',
            );
        }

        $payload = [
            'channel' => $channelId,
            'text'    => $message,
        ];

        $headers = [
            'Authorization' => 'Bearer ' . $organization->slack_access_token,
            'Content-Type'  => 'application/json',
        ];
        $endpoint = 'https://slack.com/api/chat.postMessage';
        $response = Http::withHeaders($headers)->post($endpoint, $payload);

        if ($response->successful()) {
            $data = $response->json();
            Log::debug('Sent a Slack message', ['payload' => $payload]);
        } else {
            Log::error('Failed to send a Slack message:', [
                'payload'  => $payload,
                'endpoint' => $endpoint,
                'response' => $response->json(),
                'status'   => $response->status(),
            ]);
            throw new \Exception('Slack message could not be sent');
        }
    }
}
