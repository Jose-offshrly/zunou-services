<?php

declare(strict_types=1);

namespace App\GraphQL\Mutations;

use App\Models\Organization;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

final readonly class GenerateRealtimeClientSecretMutation
{
    /** @param  array{}  $args */
    public function __invoke(null $_, array $args): string
    {
        $input = $args['input'];
        $openaiKey = config('zunou.openai.realtime_api_api_key');
        $expirationDuration = config('zunou.openai.realtime_api_expiration_duration');
        $instructions = $input['instructions'] ?? null;

        $user = Auth::user();
        $openaiKey = $user->openai_api_key ?? $openaiKey;

        $session = [
            'type'          => 'realtime',
            'model'         => 'gpt-realtime',
        ];
        
        if (!empty($instructions)) {
            $session['instructions'] = $instructions;
        }

        $response = Http::withHeaders([
            'Authorization' => "Bearer {$openaiKey}",
            'Content-Type'  => 'application/json',
        ])
            ->timeout(30)
            ->post('https://api.openai.com/v1/realtime/client_secrets', [
                'expires_after' => [
                    'anchor'  => 'created_at',
                    'seconds' => $expirationDuration,
                ],
                'session' => $session,
            ]);

        if (!$response->successful()) {
            Log::error('Failed to generate OpenAI realtime client secret', [
                'status'   => $response->status(),
                'response' => $response->body(),
                'organization_id' => $input['organizationId'],
            ]);
            throw new \Exception('Failed to generate realtime client secret');
        }

        $responseData = $response->json();
        
        if (!isset($responseData['value'])) {
            Log::error('OpenAI response missing client secret value', [
                'response' => $responseData,
            ]);
            throw new \Exception('Invalid response from OpenAI API');
        }

        return $responseData['value'];
    }
}