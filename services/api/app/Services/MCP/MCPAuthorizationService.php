<?php

namespace App\Services\MCP;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

/**
 * MCP Authorization Service
 *
 * Implements OAuth 2.1 authorization flow according to MCP specification
 */
class MCPAuthorizationService
{
    /**
     * Get configuration value with fallback
     */
    private function getConfig(string $key, string $default): string
    {
        return config("mcp.oauth.{$key}", $default);
    }

    /**
     * Get default client ID
     */
    private function getDefaultClientId(): string
    {
        return $this->getConfig('client_id', 'mcp-client');
    }

    /**
     * Get default scopes
     */
    private function getDefaultScopes(): string
    {
        return $this->getConfig('scopes', 'openid profile');
    }

    /**
     * Start OAuth 2.1 authorization flow
     *
     * @param string $mcpUrl MCP server URL
     * @param string $redirectUri OAuth redirect URI (required from frontend)
     * @return array Authorization flow data
     * @throws \Exception If authorization fails
     */
    public function startAuthorization(
        string $mcpUrl,
        string $redirectUri,
    ): array {
        try {
            // Step 1: Discover authorization server
            $authServerInfo = $this->discoverAuthServer($mcpUrl);
            if (! $authServerInfo) {
                throw new \Exception('Could not discover authorization server');
            }

            // Step 1.5: Try dynamic client registration if available
            if (isset($authServerInfo['registration_endpoint'])) {
                try {
                    $clientRegistration = $this->registerClient(
                        $authServerInfo['registration_endpoint'],
                        $redirectUri,
                    );
                    $authServerInfo['client_id'] = $clientRegistration['client_id'];
                    Log::info('Dynamically registered client', [
                        'client_id' => $clientRegistration['client_id'],
                    ]);
                } catch (\Exception $e) {
                    Log::warning(
                        'Dynamic client registration failed, using default client_id',
                        ['error' => $e->getMessage()],
                    );
                }
            }

            // Step 2: Generate PKCE parameters
            $codeVerifier  = $this->generateCodeVerifier();
            $codeChallenge = $this->generateCodeChallenge($codeVerifier);
            $state         = Str::random(32);

            // Step 3: Build authorization URL
            $authUrl = $this->buildAuthorizationUrl(
                $authServerInfo,
                $mcpUrl,
                $redirectUri,
                $codeChallenge,
                $state,
            );

            // Step 4: Store OAuth state (in production, store in database)
            $this->storeOAuthState($state, [
                'code_verifier'    => $codeVerifier,
                'mcp_url'          => $mcpUrl,
                'auth_server_info' => $authServerInfo,
                'state'            => $state,
                'redirect_uri'     => $redirectUri, // Store the redirectUri for callback service
            ]);

            Log::info('Authorization URL built successfully', [
                'state' => $state,
            ]);

            return [
                'authUrl'        => $authUrl,
                'state'          => $state,
                'mcpUrl'         => $mcpUrl,
                'authServerInfo' => $this->formatAuthServerInfo(
                    $authServerInfo,
                ),
            ];
        } catch (\Exception $e) {
            Log::error('Authorization error', ['error' => $e->getMessage()]);
            throw $e;
        }
    }

    /**
     * Discover authorization server using MCP specification methods
     */
    private function discoverAuthServer(string $mcpUrl): ?array
    {
        try {
            Log::info('Discovering authorization server', [
                'mcpUrl' => $mcpUrl,
            ]);

            // First, try to make a request to the MCP server
            $response = Http::get($mcpUrl);

            Log::info('MCP server response status', [
                'status' => $response->status(),
            ]);

            // If we get a 401, look for WWW-Authenticate header
            if ($response->status() === 401) {
                $wwwAuth = $response->header('WWW-Authenticate');
                Log::info('WWW-Authenticate header found', [
                    'header' => $wwwAuth,
                ]);

                if ($wwwAuth) {
                    // Parse the authorization server location
                    $authServerUrl = $this->parseWWWAuthenticate($wwwAuth);
                    Log::info('Parsed auth server URL', [
                        'url' => $authServerUrl,
                    ]);

                    if ($authServerUrl) {
                        return $this->getAuthServerMetadata($authServerUrl);
                    }
                }
            }

            // If no 401 or WWW-Authenticate, try well-known endpoints
            Log::info('Trying well-known endpoints');
            return $this->tryWellKnownEndpoints($mcpUrl);
        } catch (\Exception $e) {
            Log::error('Auth server discovery error', [
                'error' => $e->getMessage(),
            ]);
            return null;
        }
    }

    /**
     * Parse WWW-Authenticate header
     */
    private function parseWWWAuthenticate(string $wwwAuth): ?string
    {
        // Parse the authorization server location from WWW-Authenticate header
        if (preg_match('/resource="([^"]+)"/', $wwwAuth, $matches)) {
            return $matches[1];
        }
        return null;
    }

    /**
     * Get authorization server metadata
     */
    private function getAuthServerMetadata(string $authServerUrl): ?array
    {
        try {
            Log::info('Getting authorization server metadata', [
                'url' => $authServerUrl,
            ]);

            // Try OAuth 2.0 Authorization Server Metadata first
            $oauthMetadataUrl = $authServerUrl . '/.well-known/oauth-authorization-server';
            Log::info('Trying OAuth metadata URL', [
                'url' => $oauthMetadataUrl,
            ]);

            $response = Http::get($oauthMetadataUrl);
            if ($response->successful()) {
                $metadata = $response->json();
                Log::info('OAuth metadata found', ['metadata' => $metadata]);
                return array_merge($metadata, [
                    'client_id' => $this->getDefaultClientId(),
                ]);
            }

            // Try OpenID Connect Discovery
            $oidcMetadataUrl = $authServerUrl . '/.well-known/openid-configuration';
            Log::info('Trying OIDC metadata URL', ['url' => $oidcMetadataUrl]);

            $oidcResponse = Http::get($oidcMetadataUrl);
            if ($oidcResponse->successful()) {
                $metadata = $oidcResponse->json();
                Log::info('OIDC metadata found', ['metadata' => $metadata]);
                return array_merge($metadata, [
                    'client_id' => $this->getDefaultClientId(),
                ]);
            }

            Log::info('No metadata found');
            return null;
        } catch (\Exception $e) {
            Log::error('Metadata fetch error', ['error' => $e->getMessage()]);
            return null;
        }
    }

    /**
     * Try well-known endpoints for discovery
     */
    private function tryWellKnownEndpoints(string $mcpUrl): ?array
    {
        $url     = parse_url($mcpUrl);
        $baseUrl = $url['scheme'] . '://' . $url['host'];

        // Try different well-known endpoints
        $endpoints = [
            $baseUrl . '/.well-known/oauth-authorization-server',
            $baseUrl . '/.well-known/openid-configuration',
        ];

        foreach ($endpoints as $endpoint) {
            try {
                $response = Http::get($endpoint);
                if ($response->successful()) {
                    $metadata = $response->json();
                    return array_merge($metadata, [
                        'client_id' => $this->getDefaultClientId(),
                    ]);
                }
            } catch (\Exception $e) {
                continue;
            }
        }

        return null;
    }

    /**
     * Dynamic client registration
     */
    private function registerClient(
        string $registrationEndpoint,
        string $redirectUri,
    ): array {
        $registrationData = [
            'application_type'           => 'web',
            'redirect_uris'              => [$redirectUri],
            'token_endpoint_auth_method' => 'none',
            'grant_types'                => ['authorization_code'],
            'response_types'             => ['code'],
        ];

        $response = Http::post($registrationEndpoint, $registrationData);

        if (! $response->successful()) {
            throw new \Exception(
                'Client registration failed: ' . $response->status(),
            );
        }

        return $response->json();
    }

    /**
     * Build authorization URL
     */
    private function buildAuthorizationUrl(
        array $authServerInfo,
        string $mcpUrl,
        string $redirectUri,
        string $codeChallenge,
        string $state,
    ): string {
        $authUrl  = $authServerInfo['authorization_endpoint'];
        $clientId = $authServerInfo['client_id'] ?? $this->getDefaultClientId();

        $params = [
            'response_type'         => 'code',
            'client_id'             => $clientId,
            'redirect_uri'          => $redirectUri,
            'scope'                 => $this->getDefaultScopes(),
            'state'                 => $state,
            'code_challenge'        => $codeChallenge,
            'code_challenge_method' => 'S256',
            'resource'              => $mcpUrl, // RFC 8707 Resource Indicators
        ];

        return $authUrl . '?' . http_build_query($params);
    }

    /**
     * Store OAuth state in cache for callback retrieval
     */
    private function storeOAuthState(string $state, array $stateData): void
    {
        // Store in cache for callback service to retrieve
        $cacheKey = "mcp_oauth_state:{$state}";
        $ttl      = config('mcp.oauth.state_ttl', 30);
        Cache::put($cacheKey, $stateData, now()->addMinutes($ttl));
    }

    /**
     * Format auth server info for GraphQL response
     */
    private function formatAuthServerInfo(array $authServerInfo): array
    {
        return [
            'authorizationEndpoint'  => $authServerInfo['authorization_endpoint']   ?? null,
            'tokenEndpoint'          => $authServerInfo['token_endpoint']           ?? null,
            'registrationEndpoint'   => $authServerInfo['registration_endpoint']    ?? null,
            'clientId'               => $authServerInfo['client_id']                ?? $this->getDefaultClientId(),
            'scopesSupported'        => $authServerInfo['scopes_supported']         ?? null,
            'responseTypesSupported' => $authServerInfo['response_types_supported'] ?? null,
            'grantTypesSupported'    => $authServerInfo['grant_types_supported']    ?? null,
        ];
    }

    /**
     * Generate PKCE code verifier
     */
    private function generateCodeVerifier(): string
    {
        return rtrim(strtr(base64_encode(random_bytes(32)), '+/', '-_'), '=');
    }

    /**
     * Generate PKCE code challenge
     */
    private function generateCodeChallenge(string $verifier): string
    {
        return rtrim(
            strtr(base64_encode(hash('sha256', $verifier, true)), '+/', '-_'),
            '=',
        );
    }
}
