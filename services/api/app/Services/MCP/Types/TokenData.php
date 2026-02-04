<?php 

namespace App\Services\MCP\Types;

use Exception;

/**
 * Token Data Class for MCP OAuth 2.1 Authorization
 * Represents the token data as typed properties
 */
class TokenData
{
    /**
     * MCP server URL
     * @var string
     */
    public string $mcp_server;

    /**
     * OAuth token endpoint
     * @var string
     */
    public string $token_endpoint;

    /**
     * OAuth client ID
     * @var string
     */
    public string $client_id;

    /**
     * Access token
     * @var string
     */
    public string $access_token;

    /**
     * Refresh token
     * @var string
     */
    public string $refresh_token;

    /**
     * Token expiration time (epoch milliseconds)
     * @var int
     */
    public int $expires_at;

    /**
     * Token type (e.g., 'Bearer')
     * @var string|null
     */
    public ?string $token_type;

    /**
     * Token scope
     * @var string|null
     */
    public ?string $scope;

    /**
     * Provider name (e.g., 'jira', 'github')
     * @var string|null
     */
    public ?string $provider;

    /**
     * Constructor
     * @param array $data Token data array
     */
    public function __construct(array $data)
    {
        $this->provider = $data['provider'];
        $this->mcp_server = $data['mcp_server'];
        $this->token_endpoint = $data['token_endpoint'];
        $this->client_id = $data['client_id'];
        $this->access_token = $data['access_token'];
        $this->refresh_token = $data['refresh_token'];
        $this->expires_at = $data['expires_at'];
        $this->token_type = $data['token_type'] ?? "Bearer";
        $this->scope = $data['scope'] ?? null;
    }

    /**
     * Create from JSON string
     * @param string $json JSON string
     * @return self
     */
    public static function fromJson(string $json): self
    {
        $data = json_decode($json, true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new Exception('Invalid JSON: ' . json_last_error_msg());
        }
        return new self($data);
    }
   
    /**
     * Create from Array
     * @param array $data array
     * @return self
     */
    public static function fromArray(array $data): self
    {
        return new self($data);
    }

    /**
     * Convert to array
     * @return array
     */
    public function toArray(): array
    {
        return [
            'mcp_server' => $this->mcp_server,
            'token_endpoint' => $this->token_endpoint,
            'client_id' => $this->client_id,
            'access_token' => $this->access_token,
            'refresh_token' => $this->refresh_token,
            'expires_at' => $this->expires_at,
            'token_type' => $this->token_type,
            'scope' => $this->scope,
            'provider' => $this->provider
        ];
    }

    /**
     * Convert to JSON string
     * @return string
     */
    public function toJson(): string
    {
        return json_encode($this->toArray());
    }

    /**
     * Check if token is expired
     * @param int $bufferSeconds Buffer time in seconds
     * @return bool
     */
    public function isExpired(int $bufferSeconds = 60): bool
    {
        $now = time() * 1000; // Convert to milliseconds
        $bufferMs = $bufferSeconds * 1000;
        return ($this->expires_at - $bufferMs) <= $now;
    }

    /**
     * Get time until expiration in seconds
     * @return int
     */
    public function getTimeUntilExpiration(): int
    {
        $now = time() * 1000;
        return max(0, ($this->expires_at - $now) / 1000);
    }
} 