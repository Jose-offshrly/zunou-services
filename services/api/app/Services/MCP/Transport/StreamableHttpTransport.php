<?php

namespace App\Services\MCP\Transport;

use GuzzleHttp\Client;
use GuzzleHttp\Exception\RequestException;
use Illuminate\Support\Facades\Log;

/**
 * Streamable HTTP Transport for MCP
 *
 * Based on the official MCP TypeScript SDK implementation
 * Implements the MCP Streamable HTTP transport specification
 */
class StreamableHttpTransport implements TransportInterface
{
    private Client $client;
    private string $url;
    private array $headers;
    private ?string $sessionId       = null;
    private ?string $protocolVersion = null;
    private bool $connected          = false;
    private float $connectionTimeout;
    private float $readTimeout;
    private bool $verifySsl;
    private ?string $lastResponse = null;

    public function __construct(
        string $url,
        array $headers = [],
        array $options = [],
    ) {
        $this->url     = $url;
        $this->headers = $headers;

        // Set timeouts
        $this->connectionTimeout = $options['connection_timeout'] ?? 10.0;
        $this->readTimeout       = $options['read_timeout']       ?? 30.0;
        $this->verifySsl         = $options['verify_ssl']         ?? true;

        // Create Guzzle client with configured options
        $this->client = new Client([
            'timeout' => $this->connectionTimeout,
            'verify'  => $this->verifySsl,
        ]);

        Log::info("StreamableHttpTransport initialized for URL: {$url}");
    }

    public function connect(): bool
    {
        if ($this->connected) {
            return true;
        }

        Log::info("Connecting to MCP server: {$this->url}");

        // Try to establish SSE connection first (optional according to spec)
        try {
            $this->tryEstablishSSEConnection();
        } catch (\Exception $e) {
            Log::info(
                'SSE connection not available, continuing with POST-only mode: ' .
                    $e->getMessage(),
            );
        }

        $this->connected = true;
        Log::info('Connected to MCP server');
        return true;
    }

    public function disconnect(): bool
    {
        if (! $this->connected) {
            return true;
        }

        // Terminate session if we have one
        if ($this->sessionId) {
            try {
                $this->terminateSession();
            } catch (\Exception $e) {
                Log::warning(
                    'Failed to terminate session: ' . $e->getMessage(),
                );
            }
        }

        $this->connected = false;
        $this->sessionId = null;
        Log::info('Disconnected from MCP server');
        return true;
    }

    public function send(string $message): bool
    {
        if (! $this->connected) {
            throw new \Exception('Transport not connected');
        }

        Log::info(
            'Sending message to MCP server: ' . substr($message, 0, 200) . '...',
        );

        try {
            // Prepare headers
            $headers                 = $this->getCommonHeaders();
            $headers['Content-Type'] = 'application/json';
            $headers['Accept']       = 'application/json, text/event-stream';

            // Make POST request
            $response = $this->client->post($this->url, [
                'headers' => $headers,
                'body'    => $message,
                'timeout' => $this->readTimeout,
            ]);

            $statusCode = $response->getStatusCode();
            Log::info("POST response status: {$statusCode}");

            // Handle session ID from response headers
            $sessionIdHeader = $response->getHeaderLine('mcp-session-id');
            if ($sessionIdHeader) {
                $this->sessionId = $sessionIdHeader;
                Log::info(
                    "Received session ID from server: {$this->sessionId}",
                );
            }

            // Handle different response status codes
            if ($statusCode === 202) {
                Log::info(
                    'Request accepted (202) - no response body to process',
                );
                return true;
            }

            if ($statusCode === 401) {
                throw new \Exception('Authentication required');
            }

            if (
                ! $response->getStatusCode() >= 200 && $response->getStatusCode() < 300
            ) {
                $body = $response->getBody()->getContents();
                throw new \Exception("HTTP error {$statusCode}: {$body}");
            }

            // Store response for receive() method
            $responseBody       = $response->getBody()->getContents();
            $this->lastResponse = $this->parseSSEResponse($responseBody);
            Log::info('Response stored for receive() method');
            return true;
        } catch (RequestException $e) {
            $statusCode = $e->getResponse()?->getStatusCode();
            $body       = $e->getResponse()?->getBody()?->getContents() ?? 'No response body';

            Log::error("HTTP request failed: {$statusCode} - {$body}");

            if ($statusCode === 401) {
                throw new \Exception('Authentication required');
            }

            throw new \Exception(
                "HTTP request failed: {$statusCode} - {$body}",
            );
        }
    }

    public function receive(?float $timeout = null): ?string
    {
        if (! $this->connected) {
            throw new \Exception('Transport not connected');
        }

        // Return stored response if available
        if (isset($this->lastResponse)) {
            $response = $this->lastResponse;
            unset($this->lastResponse);
            return $response;
        }

        // For now, we don't implement persistent SSE streaming
        // This would require a more complex implementation with background processes
        return null;
    }

    public function isConnected(): bool
    {
        return $this->connected;
    }

    public function getSessionId(): ?string
    {
        return $this->sessionId;
    }

    public function setProtocolVersion(string $version): void
    {
        $this->protocolVersion = $version;
    }

    public function getProtocolVersion(): ?string
    {
        return $this->protocolVersion;
    }

    /**
     * Try to establish SSE connection (optional according to spec)
     */
    private function tryEstablishSSEConnection(): void
    {
        $headers           = $this->getCommonHeaders();
        $headers['Accept'] = 'text/event-stream';

        try {
            $response = $this->client->get($this->url, [
                'headers' => $headers,
                'timeout' => $this->connectionTimeout,
            ]);

            if ($response->getStatusCode() === 405) {
                Log::info(
                    'Server does not support SSE stream at GET endpoint (405)',
                );
                return;
            }

            if ($response->getStatusCode() !== 200) {
                throw new \Exception(
                    "SSE connection failed: {$response->getStatusCode()}",
                );
            }

            Log::info('SSE connection established successfully');
        } catch (RequestException $e) {
            if ($e->getResponse()?->getStatusCode() === 405) {
                Log::info(
                    'Server does not support SSE stream at GET endpoint (405)',
                );
                return;
            }
            throw $e;
        }
    }

    /**
     * Get common headers for all requests
     */
    private function getCommonHeaders(): array
    {
        $headers = $this->headers;

        // Add session ID if available
        if ($this->sessionId) {
            $headers['mcp-session-id'] = $this->sessionId;
        }

        // Add protocol version if set
        if ($this->protocolVersion) {
            $headers['mcp-protocol-version'] = $this->protocolVersion;
        }

        return $headers;
    }

    /**
     * Parse SSE response and extract JSON data
     *
     * @param string $responseBody The raw response body
     * @return string|null The parsed JSON data or null if not SSE format
     */
    private function parseSSEResponse(string $responseBody): ?string
    {
        // Check if this is an SSE response
        if (
            strpos($responseBody, 'event:') === 0 || strpos($responseBody, 'data:') !== false
        ) {
            Log::info('Parsing SSE response');

            // Parse SSE format: extract data lines
            $lines     = explode("\n", $responseBody);
            $dataLines = [];

            foreach ($lines as $line) {
                $line = trim($line);
                if (strpos($line, 'data:') === 0) {
                    $data = substr($line, 5); // Remove 'data:' prefix
                    if (! empty($data)) {
                        $dataLines[] = $data;
                    }
                }
            }

            // Return the first data line (for now, we expect single responses)
            if (! empty($dataLines)) {
                Log::info('Extracted JSON data from SSE response');
                return $dataLines[0];
            }
        }

        // Not SSE format, return as-is
        return $responseBody;
    }

    /**
     * Terminate the current session
     */
    private function terminateSession(): void
    {
        if (! $this->sessionId) {
            return;
        }

        try {
            $headers = $this->getCommonHeaders();

            $response = $this->client->delete($this->url, [
                'headers' => $headers,
                'timeout' => $this->connectionTimeout,
            ]);

            if ($response->getStatusCode() === 405) {
                Log::info(
                    'Server does not support explicit session termination (405)',
                );
            } elseif (
                $response->getStatusCode() >= 200 && $response->getStatusCode() < 300
            ) {
                Log::info('Session terminated successfully');
            } else {
                Log::warning(
                    "Session termination returned status: {$response->getStatusCode()}",
                );
            }
        } catch (RequestException $e) {
            if ($e->getResponse()?->getStatusCode() === 405) {
                Log::info(
                    'Server does not support explicit session termination (405)',
                );
                return;
            }
            throw $e;
        }
    }
}
