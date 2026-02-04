<?php

namespace App\Services\MCP\Transport;

use GuzzleHttp\Client;
use GuzzleHttp\Exception\RequestException;
use Illuminate\Support\Facades\Log;

/**
 * Server-Sent Events (SSE) transport for MCP communication
 */
class SSETransport implements TransportInterface
{
    /**
     * The SSE endpoint URL
     */
    protected string $url;
    
    /**
     * HTTP headers for SSE connection
     */
    protected array $headers;
    
    /**
     * The HTTP client
     */
    protected ?Client $client = null;
    
    /**
     * The SSE stream resource
     */
    protected $stream = null;
    
    /**
     * The endpoint for sending messages (POST)
     */
    protected ?string $postEndpoint = null;
    
    /**
     * Whether the transport is connected
     */
    protected bool $connected = false;
    
    /**
     * Create a new SSE transport
     *
     * @param string $url The SSE endpoint URL
     * @param array $headers HTTP headers for the connection
     */
    public function __construct(string $url, array $headers = [])
    {
        $this->url = $url;
        $this->headers = $headers;
        // Configure the Guzzle client with appropriate settings for both HTTP and HTTPS
        $clientConfig = [
            'timeout' => 0, // No timeout for the SSE connection
            'headers' => $this->headers,
            'http_errors' => false, // Don't throw exceptions for error status codes
        ];
        
        // Add SSL verification settings for HTTPS
        if (strpos($url, 'https') === 0) {
            $clientConfig['verify'] = true; // Verify SSL certificates
            $clientConfig['connect_timeout'] = 10; // Connection timeout in seconds
        }
        
        $this->client = new Client($clientConfig);
    }
    
    /**
     * Connect to the transport using fgets() streaming
     *
     * @return bool True if connected successfully
     * @throws \Exception If connection fails
     */
    public function connect(): bool
    {
        if ($this->isConnected()) {
            return true;
        }
        
        try {
            Log::info("Connecting to MCP SSE endpoint: {$this->url}");
            
            // Build the HTTP request manually for SSE
            $context = stream_context_create([
                'http' => [
                    'method' => 'GET',
                    'header' => $this->buildHeaders(),
                    'timeout' => 10, // Connection timeout only
                ],
                'ssl' => [
                    'verify_peer' => true,
                    'verify_peer_name' => true,
                ]
            ]);
            
            // Open the SSE stream
            $this->stream = fopen($this->url, 'r', false, $context);
            
            if ($this->stream === false) {
                Log::error("Failed to open SSE connection to: {$this->url}");
                throw new \Exception("Failed to open SSE connection to: {$this->url}");
            }
            
            // Set stream timeout to prevent blocking
            stream_set_timeout($this->stream, 0, 100000); // 0.1 second timeout
            
            // Wait for the 'endpoint' event to get the POST endpoint
            $timeout = time() + 30; // 30 second timeout
            while (time() < $timeout && $this->postEndpoint === null) {
                $event = $this->readSSEEvent();
                
                if ($event !== null) {
                    // Check if the server returned an error response
                    if ($event['event'] === 'error') {
                        $data = $event['data'];
                        $errorData = json_decode($data, true);
                        if ($errorData && isset($errorData['error'])) {
                            $errorMsg = $errorData['error'];
                            $errorDesc = $errorData['error_description'] ?? 'No description';
                            Log::error("SSE connection failed: {$errorMsg} - {$errorDesc}");
                            throw new \Exception("SSE connection failed: {$errorMsg} - {$errorDesc}");
                        } else {
                            Log::error("SSE connection failed: " . $data);
                            throw new \Exception("SSE connection failed: " . $data);
                        }
                    }
                    
                    if ($event['event'] === 'message' || empty($event['event'])) {
                        $data = $event['data'];
                        if (strpos($data, '"error"') !== false) {
                            $errorData = json_decode($data, true);
                            if ($errorData && isset($errorData['error'])) {
                                $errorMsg = $errorData['error'];
                                $errorDesc = $errorData['error_description'] ?? 'No description';
                                Log::error("SSE connection failed: {$errorMsg} - {$errorDesc}");
                                throw new \Exception("SSE connection failed: {$errorMsg} - {$errorDesc}");
                            }
                        }
                    }
                    
                    if ($event['event'] === 'endpoint') {
                        $this->postEndpoint = $this->resolveEndpointUrl($event['data']);
                        break;
                    }
                }
                
                usleep(100000); // 100ms
            }
            
            if ($this->postEndpoint === null) {
                // Try using the same URL as the SSE endpoint for posting
                $this->postEndpoint = $this->url;
            }
            
            $this->connected = true;
            return true;
            
        } catch (\Exception $e) {
            Log::error("Failed to connect to MCP SSE endpoint: " . $e->getMessage());
            $this->disconnect();
            throw $e;
        }
    }
    
    /**
     * Disconnect from the transport
     *
     * @return bool True if disconnected successfully
     */
    public function disconnect(): bool
    {
        if ($this->stream !== null) {
            fclose($this->stream);
            $this->stream = null;
        }
        
        $this->postEndpoint = null;
        $this->connected = false;
        
        return true;
    }
    
    /**
     * Send a message through the transport
     *
     * @param string $message The message to send
     * @return bool True if sent successfully
     * @throws \Exception If sending fails
     */
    public function send(string $message): bool
    {
        if (!$this->isConnected()) {
            throw new \Exception("Cannot send message: transport not connected");
        }
        
        if ($this->postEndpoint === null) {
            throw new \Exception("Cannot send message: no POST endpoint available");
        }
        
        try {
            // Send the raw JSON string directly without decoding/re-encoding
            // This preserves the original object structure
            $response = $this->client->post($this->postEndpoint, [
                'body' => $message,
                'headers' => array_merge($this->headers, ['Content-Type' => 'application/json']),
            ]);
            
            $statusCode = $response->getStatusCode();
            return $statusCode >= 200 && $statusCode < 300;
            
        } catch (RequestException $e) {
            Log::error("Failed to send message to MCP server: " . $e->getMessage());
            throw new \Exception("Failed to send message: " . $e->getMessage());
        }
    }
    
    /**
     * Receive a message from the transport
     *
     * @param float|null $timeout Timeout in seconds (null for no timeout)
     * @return string|null The received message, or null if no message available
     * @throws \Exception If receiving fails
     */
    public function receive(?float $timeout = null): ?string
    {
        if (!$this->isConnected()) {
            throw new \Exception("Cannot receive message: transport not connected");
        }
        
        // Validate stream is still valid
        if ($this->stream === null || feof($this->stream)) {
            Log::warning("SSE connection lost - stream is null or at EOF");
            $this->connected = false;
            throw new \Exception("SSE connection lost");
        }
        
        $endTime = $timeout !== null ? microtime(true) + $timeout : null;
        
        do {
            // Check timeout first before attempting to read
            if ($endTime !== null && microtime(true) >= $endTime) {
                return null;
            }
            
            // Check if stream is still valid
            if ($this->stream === null || feof($this->stream)) {
                $this->connected = false;
                throw new \Exception("SSE connection lost");
            }
            
            $event = $this->readSSEEvent($timeout !== null ? $endTime - microtime(true) : null);
            
            if ($event !== null) {
                if ($event['event'] === 'message') {
                    return $event['data'];
                } elseif ($event['event'] === 'error') {
                    Log::error("SSE error event received: " . $event['data']);
                    throw new \Exception("SSE error: " . $event['data']);
                }
                // Ignore other event types
            }
            
            // Short sleep to avoid busy-waiting
            if ($event === null) {
                usleep(10000); // 10ms
            }
            
        } while (true);
    }
    
    /**
     * Check if the transport is connected
     *
     * @return bool True if connected
     */
    public function isConnected(): bool
    {
        if (!$this->connected || $this->stream === null) {
            return false;
        }
        
        // Check if stream is at EOF
        if (feof($this->stream)) {
            $this->connected = false;
            return false;
        }
        
        return true;
    }
    
    /**
     * Read an SSE event from the stream using fgets()
     *
     * @param float|null $timeout Timeout in seconds (null for no timeout)
     * @return array|null The event data, or null if no event available
     */
    protected function readSSEEvent(?float $timeout = null): ?array
    {
        if ($this->stream === null || feof($this->stream)) {
            return null;
        }
        
        $event = '';
        $data = '';
        $eventId = '';
        $retry = '';
        $methodStartTime = microtime(true);
        
        // Read lines using fgets() until we get a complete event
        while (!feof($this->stream)) {
            // Read a line using fgets()
            $line = fgets($this->stream);
            if ($line === false) {
                // Check if we have a complete event
                if (!empty($data)) {
                    break;
                }
                
                // Check timeout
                if ($timeout !== null && (microtime(true) - $methodStartTime) > $timeout) {
                    return null;
                }
                
                // No data and no complete event, return null
                return null;
            }
            
            // Check if this line contains an error response
            $trimmedLine = trim($line);
            if (strpos($trimmedLine, '"error"') !== false) {
                $errorData = json_decode($trimmedLine, true);
                if ($errorData && isset($errorData['error'])) {
                    Log::error("SSE server returned error response: " . $trimmedLine);
                    $this->connected = false;
                    return [
                        'event' => 'error',
                        'data' => $trimmedLine,
                        'id' => '',
                        'retry' => '',
                    ];
                }
            }
            
            // Empty line signals the end of an event
            if ($line === "\n" || $line === "\r\n") {
                if (!empty($data)) {
                    // Default event name is 'message' if not specified
                    $event = $event ?: 'message';
                    
                    return [
                        'event' => $event,
                        'data' => $data,
                        'id' => $eventId,
                        'retry' => $retry,
                    ];
                }
                // Empty event, continue reading
                continue;
            }
            
            // Trim trailing newlines
            $line = rtrim($line, "\r\n");
            
            // Parse SSE fields
            if (preg_match('/^event: (.+)$/', $line, $matches)) {
                $event = $matches[1];
            } elseif (preg_match('/^data: (.*)$/', $line, $matches)) {
                // According to SSE spec, multiple data lines should be concatenated without newlines
                $newDataPiece = $matches[1];
                $data = empty($data) ? $newDataPiece : $data . $newDataPiece;
            } elseif (preg_match('/^id: (.+)$/', $line, $matches)) {
                $eventId = $matches[1];
            } elseif (preg_match('/^retry: (.+)$/', $line, $matches)) {
                $retry = $matches[1];
            } elseif (substr($line, 0, 1) === ':') {
                // Comment, ignore
            }
        }
        
        // If we have data but no complete event, return null (continue reading)
        return null;
    }
    
    /**
     * Resolve a relative endpoint URL against the base URL
     *
     * @param string $endpoint The endpoint path
     * @return string The full endpoint URL
     */
    protected function resolveEndpointUrl(string $endpoint): string
    {
        // If the endpoint is already a full URL, return it
        if (preg_match('/^https?:\/\//', $endpoint)) {
            // Validate that the endpoint has the same origin as the SSE URL
            $sseUrl = parse_url($this->url);
            $endpointUrl = parse_url($endpoint);
            
            if (
                !isset($sseUrl['host']) || !isset($endpointUrl['host']) ||
                $sseUrl['host'] !== $endpointUrl['host'] ||
                (isset($sseUrl['scheme']) && isset($endpointUrl['scheme']) && $sseUrl['scheme'] !== $endpointUrl['scheme'])
            ) {
                throw new \Exception("Endpoint URL has different origin than SSE URL: {$endpoint}");
            }
            
            return $endpoint;
        }
        
        // Extract base URL (scheme, host, port)
        $parsed = parse_url($this->url);
        $base = $parsed['scheme'] . '://' . $parsed['host'];
        if (isset($parsed['port'])) {
            $base .= ':' . $parsed['port'];
        }
        
        // Remove trailing slash from base and leading slash from endpoint
        $base = rtrim($base, '/');
        $endpoint = ltrim($endpoint, '/');
        
        return "{$base}/{$endpoint}";
    }
    
    /**
     * Get the session ID
     *
     * @return string|null The session ID, or null if not set
     */
    public function getSessionId(): ?string
    {
        return null; // SSE transport doesn't use session IDs
    }
    
    /**
     * Set the protocol version
     *
     * @param string $version The protocol version
     */
    public function setProtocolVersion(string $version): void
    {
        // SSE transport doesn't need protocol version
    }
    
    /**
     * Get the protocol version
     *
     * @return string|null The protocol version, or null if not set
     */
    public function getProtocolVersion(): ?string
    {
        return null; // SSE transport doesn't use protocol version
    }
    
    /**
     * Build HTTP headers string for stream context
     */
    private function buildHeaders(): string
    {
        $headerLines = [];
        foreach ($this->headers as $name => $value) {
            $headerLines[] = "{$name}: {$value}";
        }
        return implode("\r\n", $headerLines);
    }
}
