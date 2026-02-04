<?php

namespace App\Services\MCP;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * MCP Callback Service
 *
 * Handles OAuth 2.1 authorization code exchange for tokens
 */
class MCPCallbackService
{
    /**
     * Exchange authorization code for access tokens
     *
     * @param string $code Authorization code from OAuth provider
     * @param string $state OAuth state parameter for validation
     * @return array Token response data
     * @throws \Exception If exchange fails
     */
    public function exchangeCodeForTokens(string $code, string $state): array
    {
        try {
            Log::info('Exchanging authorization code for tokens', [
                'state' => $state,
            ]);

            // Retrieve stored OAuth state data
            $stateData = $this->retrieveOAuthState($state);
            if (! $stateData) {
                throw new \Exception('OAuth state not found or expired');
            }

            // Validate state matches
            if ($stateData['state'] !== $state) {
                throw new \Exception('OAuth state mismatch');
            }

            $mcpUrl         = $stateData['mcp_url'];
            $codeVerifier   = $stateData['code_verifier'];
            $authServerInfo = $stateData['auth_server_info'];
            $redirectUri    = $stateData['redirect_uri']; // Get redirectUri from state data

            // Exchange code for tokens
            $tokenResponse = $this->exchangeCodeWithProvider(
                $code,
                $codeVerifier,
                $authServerInfo,
                $mcpUrl,
                $redirectUri,
            );

            // Store tokens (in production, save to database)
            $this->storeTokens($mcpUrl, $tokenResponse);

            // Clean up OAuth state
            $this->cleanupOAuthState($state);

            return [
                'mcpUrl'        => $mcpUrl,
                'access_token'  => $tokenResponse['access_token'],
                'token_type'    => $tokenResponse['token_type']    ?? 'Bearer',
                'expires_in'    => $tokenResponse['expires_in']    ?? null,
                'refresh_token' => $tokenResponse['refresh_token'] ?? null,
                'scope'         => $tokenResponse['scope']         ?? null,
            ];
        } catch (\Exception $e) {
            Log::error('Token exchange failed', [
                'error' => $e->getMessage(),
                'state' => $state,
            ]);
            throw $e;
        }
    }

    /**
     * Exchange authorization code with OAuth provider
     */
    private function exchangeCodeWithProvider(
        string $code,
        string $codeVerifier,
        array $authServerInfo,
        string $mcpUrl,
        string $redirectUri,
    ): array {
        $tokenEndpoint = $authServerInfo['token_endpoint'];
        $clientId      = $authServerInfo['client_id'] ?? 'mcp-client';

        $tokenData = [
            'grant_type'    => 'authorization_code',
            'code'          => $code,
            'redirect_uri'  => $redirectUri, // Use the redirectUri from OAuth state
            'client_id'     => $clientId,
            'code_verifier' => $codeVerifier,
        ];

        // Add resource parameter if supported (RFC 8707)
        if (isset($authServerInfo['resource'])) {
            $tokenData['resource'] = $mcpUrl;
        }

        $response = Http::asForm()->post($tokenEndpoint, $tokenData);

        if (! $response->successful()) {
            $errorData = $response->json();
            Log::error('Token request failed', [
                'status' => $response->status(),
                'error'  => $errorData,
            ]);

            throw new \Exception(
                'Token exchange failed: ' .
                    ($errorData['error_description'] ?? ($errorData['error'] ?? 'Unknown error')),
            );
        }

        $tokenResponse = $response->json();

        return $tokenResponse;
    }

    /**
     * Retrieve stored OAuth state data
     */
    private function retrieveOAuthState(string $state): ?array
    {
        // TODO: In production, store in database instead of cache
        $cacheKey  = "mcp_oauth_state:{$state}";
        $stateData = Cache::get($cacheKey);

        if (! $stateData) {
            Log::warning('OAuth state not found in cache', ['state' => $state]);
            return null;
        }

        return $stateData;
    }

    /**
     * Store OAuth tokens
     */
    private function storeTokens(string $mcpUrl, array $tokenResponse): void
    {
        // TODO: In production, save to database (AiAgent credentials)
        $tokenData = [
            'mcpUrl'        => $mcpUrl,
            'access_token'  => $tokenResponse['access_token'],
            'token_type'    => $tokenResponse['token_type']    ?? 'Bearer',
            'expires_in'    => $tokenResponse['expires_in']    ?? null,
            'refresh_token' => $tokenResponse['refresh_token'] ?? null,
            'scope'         => $tokenResponse['scope']         ?? null,
            'expires_at'    => $this->calculateExpiryTime(
                $tokenResponse['expires_in'] ?? null,
            ),
        ];

        Log::info('Storing OAuth tokens', [
            'mcpUrl'            => $mcpUrl,
            'has_refresh_token' => ! empty($tokenResponse['refresh_token']),
        ]);

        // For now, just log the tokens
        // In production, save to AiAgent model credentials field
        Cache::put("mcp_tokens:{$mcpUrl}", $tokenData, now()->addDays(30));
    }

    /**
     * Clean up OAuth state after successful exchange
     */
    private function cleanupOAuthState(string $state): void
    {
        $cacheKey = "mcp_oauth_state:{$state}";
        Cache::forget($cacheKey);
        Log::info('OAuth state cleaned up', ['state' => $state]);
    }

    /**
     * Calculate token expiry time
     */
    private function calculateExpiryTime(?int $expiresIn): ?int
    {
        if (! $expiresIn) {
            return null;
        }

        return now()->addSeconds($expiresIn)->timestamp * 1000; // Convert to milliseconds
    }
}
