<?php

namespace App\Services\MCP;

use App\Services\MCP\Types\TokenData;
use Exception;
use Illuminate\Support\Facades\Http;

/**
 * Token Manager for MCP OAuth 2.1 Authorization
 * Handles token refresh, validation, and management
 * Accepts TokenData object for type safety
 */
class TokenManager
{
    /**
     * Token data object
     * @var TokenData
     */
    private TokenData $tokenData;

    /**
     * Constructor
     * @param TokenData $tokenData Token data object
     */
    public function __construct(TokenData $tokenData)
    {
        $this->tokenData = $tokenData;
    }

    /**
     * Refreshes an access token using the refresh token
     * @return TokenData Updated token data with new access token
     * @throws Exception If refresh fails
     */
    public function refreshToken(): TokenData
    {
        try {
            $params = [
                'grant_type' => 'refresh_token',
                'refresh_token' => $this->tokenData->refresh_token,
                'client_id' => $this->tokenData->client_id
            ];

            $body = http_build_query($params);

            // Make refresh request using Laravel HTTP client
            $response = Http::asForm()
                ->timeout(30)
                ->post($this->tokenData->token_endpoint, $params);

            if (!$response->successful()) {
                error_log('Refresh error response: ' . $response->body());
                throw new Exception("Token refresh failed: " . $response->status() . " - " . $response->body());
            }

            $responseData = $response->json();

            // Update token data with new values
            $this->tokenData->access_token = $responseData['access_token'];
            $this->tokenData->expires_at = (time() * 1000) + ($responseData['expires_in'] * 1000);

            // Update refresh token if a new one is provided
            if (isset($responseData['refresh_token'])) {
                $this->tokenData->refresh_token = $responseData['refresh_token'];
            }

            return $this->tokenData;

        } catch (Exception $error) {
            error_log('Token refresh error: ' . $error->getMessage());
            throw $error;
        }
    }

    /**
     * Checks if a token is expired or will expire soon
     * @param int $bufferSeconds Buffer time in seconds before considering token expired (default: 60)
     * @return bool True if token is expired or will expire soon
     */
    public function isTokenExpired(int $bufferSeconds = 60): bool
    {
        $now = time() * 1000; // Convert to milliseconds
        $bufferMs = $bufferSeconds * 1000;
        return ($this->tokenData['expires_at'] - $bufferMs) <= $now;
    }

    /**
     * Gets a valid access token, refreshing if necessary
     * @return string Valid access token
     * @throws Exception If refresh fails
     */
    public function getValidAccessToken(): string
    {
        if ($this->isTokenExpired()) {
            error_log('Token expired, refreshing...');
            $this->refreshToken();
        }
        
        return $this->tokenData->access_token;
    }

    /**
     * Validates token data structure
     * @return bool True if token data is valid
     */
    public function validateTokenData(): bool
    {
        // TokenData constructor already validates required fields
        return true;
    }

    /**
     * Gets the current token data
     * @return TokenData Token data object
     */
    public function getTokenData(): TokenData
    {
        return $this->tokenData;
    }

    /**
     * Updates token data
     * @param TokenData $tokenData New token data
     */
    public function updateTokenData(TokenData $tokenData): void
    {
        $this->tokenData = $tokenData;
    }

    /**
     * Convert token data to JSON string
     * @return string JSON string of token data
     */
    public function toJson(): string
    {
        return $this->tokenData->toJson();
    }
}