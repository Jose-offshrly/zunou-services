<?php

declare(strict_types=1);

namespace App\GraphQL\Mutations;

use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

final readonly class GenerateAssemblyaiRealtimeClientSecretMutation
{
    /**
     * Generate a short-lived AssemblyAI Realtime token for client-side usage.
     *
     * @param  array{input: array{organizationId: string, instructions?: string|null}}  $args
     */
    public function __invoke(null $_, array $args): string
    {
        $input = $args['input'];
        $expirationDuration = (int) config(
            'zunou.assemblyai.realtime_api_expiration_duration'
        );

        $assemblyaiKey = (string) config(
            'zunou.assemblyai.realtime_api_api_key'
        );
        Log::info('AssemblyAI API key', ['assemblyaiKey' => $assemblyaiKey]);

        $user = Auth::user();
        $assemblyaiKey = $user->assemblyai_key ?? $assemblyaiKey;

        if (empty($assemblyaiKey)) {
            Log::error('AssemblyAI API key is not configured', [
                'organization_id' => $input['organizationId'],
            ]);
            throw new \Exception('AssemblyAI API key is not configured');
        }

        // AssemblyAI Realtime uses short-lived tokens created from a permanent API key.
        $response = Http::withHeaders([
            'Authorization' => $assemblyaiKey,
            'Content-Type' => 'application/json',
        ])
            ->timeout(30)
            ->get('https://streaming.assemblyai.com/v3/token', [
                // AssemblyAI expects seconds until expiry.
                'expires_in_seconds' => $expirationDuration,
            ]);

        if (!$response->successful()) {
            Log::error('Failed to generate AssemblyAI realtime token', [
                'status' => $response->status(),
                'response' => $response->body(),
                'organization_id' => $input['organizationId'],
            ]);
            throw new \Exception(
                'Failed to generate AssemblyAI realtime client secret'
            );
        }

        $responseData = $response->json();
        $token = $responseData['token'] ?? ($responseData['value'] ?? null);

        if (!is_string($token) || $token === '') {
            Log::error('AssemblyAI response missing realtime token', [
                'response' => $responseData,
            ]);
            throw new \Exception('Invalid response from AssemblyAI API');
        }

        return $token;
    }
}
