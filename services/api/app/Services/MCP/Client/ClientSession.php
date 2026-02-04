<?php

namespace App\Services\MCP\Client;

use App\Services\MCP\Transport\TransportInterface;
use App\Services\MCP\Types\JSONRPCRequest;
use App\Services\MCP\Types\JSONRPCResponse;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use stdClass;

/**
 * MCP Client Session
 *
 * Handles communication with an MCP server using the Model Context Protocol
 */
class ClientSession
{
    /**
     * The transport used for communication
     */
    protected TransportInterface $transport;

    /**
     * Whether the session has been initialized
     */
    protected bool $initialized = false;

    /**
     * Client information
     */
    protected array $clientInfo;

    /**
     * Server capabilities from initialize result
     */
    protected array $serverCapabilities = [];

    /**
     * Request timeout in seconds
     */
    protected ?float $requestTimeout;

    /**
     * Create a new ClientSession
     *
     * @param TransportInterface $transport The transport to use
     * @param array|null $clientInfo Client information
     * @param float|null $requestTimeout Request timeout in seconds (null for no timeout)
     */
    public function __construct(
        TransportInterface $transport,
        ?array $clientInfo = null,
        ?float $requestTimeout = 60.0,
    ) {
        $this->transport  = $transport;
        $this->clientInfo = $clientInfo ?? [
            'name'    => 'php-mcp-client',
            'version' => '0.1.0',
        ];
        $this->requestTimeout = $requestTimeout;
    }

    /**
     * Initialize the session
     *
     * @return array The initialize result
     * @throws \Exception If initialization fails
     */
    public function initialize(): void
    {
        if ($this->initialized) {
            return;
        }

        Log::info('Initializing MCP client session');

        // Set protocol version on transport if supported
        if (method_exists($this->transport, 'setProtocolVersion')) {
            $this->transport->setProtocolVersion('2024-11-05');
        }

        // Connect to the transport
        if (! $this->transport->connect()) {
            throw new \Exception('Failed to connect to transport');
        }

        // Send initialize request
        try {
            Log::info('Sending initialize request to MCP server');

            // Get session ID from transport if available
            $sessionId = null;
            if (method_exists($this->transport, 'getSessionId')) {
                $sessionId = $this->transport->getSessionId();
            }

            $initializeParams = [
                'protocolVersion' => '0.1',
                'capabilities'    => (object) [
                    'experimental' => (object) [], // Empty object instead of array
                ],
                'clientInfo' => $this->clientInfo,
            ];

            // Include session ID if available
            if ($sessionId) {
                $initializeParams['sessionId'] = $sessionId;
            }

            $initializeResult = $this->sendRequest(
                'initialize',
                $initializeParams,
            );
            Log::info('Initialize request successful');
        } catch (\Exception $e) {
            Log::error('Initialize request failed: ' . $e->getMessage());

            // Try with a simpler initialize request but still include capabilities
            Log::info('Trying alternate initialize request');
            $initializeParams = [
                'protocolVersion' => '0.1',
                'capabilities'    => (object) [], // Empty object (not array)
                'clientInfo'      => $this->clientInfo,
            ];

            // Include session ID if available
            if ($sessionId) {
                $initializeParams['sessionId'] = $sessionId;
            }

            $initializeResult = $this->sendRequest(
                'initialize',
                $initializeParams,
            );
        }

        // Store server capabilities
        $this->serverCapabilities = $initializeResult;

        // Send initialized notification (optional - some servers don't support it)
        try {
            $this->sendNotification('notifications/initialized');
        } catch (\Exception $e) {
            Log::warning(
                'Failed to send initialized notification: ' . $e->getMessage(),
            );
            // Try alternative notification format
            try {
                $this->sendNotification('initialized');
            } catch (\Exception $e2) {
                Log::warning(
                    'Failed to send alternative initialized notification: ' .
                        $e2->getMessage(),
                );
                // Continue anyway - some servers don't require this notification
            }
        }

        $this->initialized = true;

        Log::info(
            'MCP client session initialized with server capabilities: ' .
                json_encode($this->serverCapabilities),
        );
    }

    /**
     * List available tools
     *
     * @return array The list of tools
     * @throws \Exception If the request fails
     */
    public function listTools(): array
    {
        $this->ensureInitialized();
        return $this->sendRequest('tools/list');
    }

    /**
     * Call a tool on the MCP server
     *
     * @param string $name The tool name
     * @param array|null $arguments The tool arguments
     * @return array The tool result
     * @throws \Exception If the request fails
     */
    public function callTool(
        string $name,
        ?array $arguments = null,
        ?float $customTimeout = null,
    ): array {
        $this->ensureInitialized();

        if (empty($arguments)) {
            # handle null and empty array arguments
            $arguments = new stdClass();
        }

        $params = [
            'name'      => $name,
            'arguments' => $arguments, // Always include arguments field
        ];

        return $this->sendRequest('tools/call', $params, $customTimeout);
    }

    /**
     * List available resources
     *
     * @return array The list of resources
     * @throws \Exception If the request fails
     */
    public function listResources(): array
    {
        $this->ensureInitialized();
        return $this->sendRequest('resources/list');
    }

    /**
     * Read a resource
     *
     * @param string $uri The resource URI
     * @return array The resource content
     * @throws \Exception If the request fails
     */
    public function readResource(string $uri): array
    {
        $this->ensureInitialized();
        return $this->sendRequest('resources/read', ['uri' => $uri]);
    }

    /**
     * Send a ping to the server
     *
     * @return array Empty result on success
     * @throws \Exception If the request fails
     */
    public function ping(): array
    {
        $this->ensureInitialized();
        return $this->sendRequest('ping');
    }

    /**
     * Check if the session is initialized
     *
     * @return bool True if initialized
     */
    public function isInitialized(): bool
    {
        return $this->initialized;
    }

    /**
     * Close the session
     *
     * @return bool True if closed successfully
     */
    public function close(): bool
    {
        $result            = $this->transport->disconnect();
        $this->initialized = false;
        return $result;
    }

    /**
     * Send a request to the MCP server
     *
     * @param string $method The method to call
     * @param array|null $params The parameters for the method
     * @param float|null $customTimeout Override the default timeout for this request
     * @return array The response result
     * @throws \Exception If the request fails
     */
    protected function sendRequest(
        string $method,
        ?array $params = null,
        ?float $customTimeout = null,
    ): array {
        // Generate a unique ID for the request
        $id = (string) Str::uuid();

        // Create the request
        $request = new JSONRPCRequest($method, $params, $id);

        // Send the request
        Log::info(
            "Sending MCP request: {$method}" .
                ($params ? ' with params: ' . json_encode($params) : ''),
        );
        $this->transport->send(json_encode($request->toArray()));

        // Determine the timeout to use
        $timeout = $customTimeout ?? $this->requestTimeout;

        // Adjust timeout based on request type
        if ($method === 'tools/list' || $method === 'resources/list') {
            // Increase timeout for listing operations which may take longer on HTTPS servers
            $adjustedTimeout = $timeout * 2;
            Log::info(
                "Using extended timeout ({$adjustedTimeout}s) for {$method} request",
            );
            $timeout = $adjustedTimeout;
        }

        // Wait for response
        Log::info("Waiting for response to {$method} (timeout: {$timeout}s)");
        $responseText = $this->transport->receive($timeout);
        Log::info("Received response text: {$responseText}");

        if ($responseText === null) {
            Log::error("Timed out waiting for response to method: {$method}");
            throw new \Exception(
                "Timed out waiting for response to method: {$method}",
            );
        }

        // Parse the response
        try {
            $responseData = json_decode($responseText, true);

            if (! is_array($responseData)) {
                throw new \Exception(
                    "Invalid JSON-RPC response: {$responseText}",
                );
            }

            $response = JSONRPCResponse::fromArray($responseData);

            // Verify the ID matches
            if ($response->getId() !== $id) {
                throw new \Exception(
                    "Response ID does not match request ID: {$response->getId()} != {$id}",
                );
            }

            // Check for errors
            if ($response->isError()) {
                $error = $response->getError();
                throw new \Exception(
                    "MCP error: {$error->getMessage()} (code: {$error->getCode()})",
                );
            }

            return $response->getResult();
        } catch (\Exception $e) {
            Log::error('Error processing MCP response: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Send a notification to the MCP server
     *
     * @param string $method The method to call
     * @param array|null $params The parameters for the method
     * @return bool True if sent successfully
     * @throws \Exception If sending fails
     */
    protected function sendNotification(
        string $method,
        ?array $params = null,
    ): bool {
        // Create the notification (a request without an ID)
        $notification = new JSONRPCRequest($method, $params);

        // Send the notification
        return $this->transport->send(json_encode($notification->toArray()));
    }

    /**
     * Ensure the session is initialized
     *
     * @throws \Exception If the session is not initialized
     */
    protected function ensureInitialized(): void
    {
        if (! $this->initialized) {
            throw new \Exception('MCP client session is not initialized');
        }
    }

    /**
     * Process incoming server messages
     *
     * This method should be called regularly to handle server-initiated messages
     *
     * @param float|null $timeout Timeout in seconds (null for no timeout)
     * @return array|null The processed message, or null if no message available
     * @throws \Exception If processing fails
     */
    public function processMessages(?float $timeout = 0.1): ?array
    {
        if (! $this->transport->isConnected()) {
            return null;
        }

        $messageText = $this->transport->receive($timeout);

        if ($messageText === null) {
            return null;
        }

        try {
            $messageData = json_decode($messageText, true);

            if (! is_array($messageData)) {
                throw new \Exception(
                    "Invalid JSON-RPC message: {$messageText}",
                );
            }

            // Check if it's a request (has method and id)
            if (isset($messageData['method']) && isset($messageData['id'])) {
                // Server request - currently not implemented
                return [
                    'type'   => 'request',
                    'method' => $messageData['method'],
                    'params' => $messageData['params'] ?? null,
                    'id'     => $messageData['id'],
                ];
            }

            // Check if it's a notification (has method but no id)
            if (isset($messageData['method']) && ! isset($messageData['id'])) {
                return [
                    'type'   => 'notification',
                    'method' => $messageData['method'],
                    'params' => $messageData['params'] ?? null,
                ];
            }

            // Must be a response (has result or error and id)
            if (
                isset($messageData['id']) && (isset($messageData['result']) || isset($messageData['error']))
            ) {
                return [
                    'type'   => 'response',
                    'result' => $messageData['result'] ?? null,
                    'error'  => $messageData['error']  ?? null,
                    'id'     => $messageData['id'],
                ];
            }

            throw new \Exception("Unknown message type: {$messageText}");
        } catch (\Exception $e) {
            Log::error('Error processing MCP message: ' . $e->getMessage());
            throw $e;
        }
    }
}
