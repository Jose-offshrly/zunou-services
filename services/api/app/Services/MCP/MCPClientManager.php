<?php

namespace App\Services\MCP;

use App\Services\MCP\Client\ClientSession;
use App\Services\MCP\Transport\SSETransport;
use App\Services\MCP\Transport\StdioTransport;
use App\Services\MCP\Transport\StreamableHttpTransport;
use App\Services\MCP\Transport\TransportInterface;
use App\Services\MCP\Types\TokenData;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Log;

/**
 * MCP Client Manager
 *
 * Manages multiple MCP client sessions and provides access to MCP tools and resources
 */
class MCPClientManager
{
    /**
     * Client sessions indexed by server ID
     *
     * @var array<string, ClientSession>
     */
    protected array $sessions = [];

    /**
     * Server configurations
     *
     * @var array<string, array>
     */
    protected array $serverConfigs = [];

    /**
     * Create a new MCP Client Manager
     *
     * @param array|null $serverConfigs Optional server configurations to initialize with
     */
    public function __construct(?array $serverConfigs = null)
    {
        if ($serverConfigs !== null) {
            $this->serverConfigs = $serverConfigs;
        } else {
            // Load from config if available
            $this->serverConfigs = Config::get('mcp.servers', []);
        }

        // Initialize configured servers
        // $this->initializeServers();
    }

    /**
     * Initialize configured MCP servers
     *
     * @return void
     */
    protected function initializeServers(): void
    {
        foreach ($this->serverConfigs as $serverId => $config) {
            try {
                if (! isset($config['type'])) {
                    Log::warning(
                        "Skipping MCP server '{$serverId}': missing type",
                    );
                    continue;
                }

                if ($config['type'] === 'stdio') {
                    if (! isset($config['command'])) {
                        Log::warning(
                            "Skipping MCP server '{$serverId}': missing command",
                        );
                        continue;
                    }

                    $this->createStdioSession($config['command'], $serverId);
                } elseif ($config['type'] === 'sse') {
                    if (! isset($config['url'])) {
                        Log::warning(
                            "Skipping MCP server '{$serverId}': missing URL",
                        );
                        continue;
                    }

                    $headers = $config['headers'] ?? [];
                    $this->createSSESession(
                        $config['url'],
                        $headers,
                        $serverId,
                    );
                } elseif ($config['type'] === 'streamable-http') {
                    if (! isset($config['url'])) {
                        Log::warning(
                            "Skipping MCP server '{$serverId}': missing URL",
                        );
                        continue;
                    }

                    $headers = $config['headers'] ?? [];
                    $options = $config['options'] ?? [];
                    $this->createStreamableHttpSession(
                        $config['url'],
                        $headers,
                        $options,
                        $serverId,
                    );
                } else {
                    Log::warning(
                        "Skipping MCP server '{$serverId}': unknown type '{$config['type']}'",
                    );
                }
            } catch (\Exception $e) {
                Log::error(
                    "Error initializing MCP server '{$serverId}': {$e->getMessage()}",
                );
            }
        }
    }

    /**
     * Create a session using a stdio transport
     *
     * @param string $command The command to execute
     * @param string $sessionId The session ID
     * @return ClientSession The created session
     */
    public function createStdioSession(
        string $command,
        string $sessionId,
    ): ClientSession {
        Log::info(
            "Creating MCP stdio session '{$sessionId}' with command: {$command}",
        );

        $transport = new StdioTransport($command);
        return $this->createSession($transport, $sessionId);
    }

    /**
     * Create a session using an SSE transport
     *
     * @param string $url The SSE endpoint URL
     * @param array $headers HTTP headers for the connection
     * @param string $sessionId The session ID
     * @param ?callable $refreshTokenFn The function to refresh the token
     * @return ClientSession The created session
     */
    public function createSSESession(
        string $url,
        array $headers,
        string $sessionId,
        ?callable $refreshTokenFn = null,
    ): ClientSession {
        Log::info("Creating MCP SSE session '{$sessionId}' with URL: {$url}");
        $transport = new SSETransport($url, $headers);
        $session = $this->createSession($transport, $sessionId);

        try {
            $session->initialize();
            return $session;
        } catch (\Throwable $e) {
            if ($this->isUnauthorizedError($e) && $refreshTokenFn) {
                Log::info("Unauthorized error detected, attempting token refresh");

                $newTokenData = $refreshTokenFn();
                if ($newTokenData) {
                    Log::info("Token refreshed successfully, recreating session with new token");
                    
                    // Create new transport with refreshed token
                    $newHeaders = $headers;
                    $newHeaders['Authorization'] = 'Bearer ' . $newTokenData->access_token;
                    
                    $newTransport = new SSETransport($url, $newHeaders);
                    $newSession = $this->createSession($newTransport, $sessionId);
                    
                    // Initialize the new session
                    $newSession->initialize();
                    Log::info("New session created and initialized with refreshed token");
                    
                    return $newSession;
                } else {
                    Log::error("Token refresh failed, cannot create new session");
                    throw $e;
                }
            }
            throw $e;
        }
    }

    /**
     * Create a session using a Streamable HTTP transport
     *
     * @param string $url The HTTP endpoint URL
     * @param array $headers HTTP headers for the connection
     * @param array $options Additional options (timeout, ssl_verify, etc.)
     * @param string $sessionId The session ID
     * @return ClientSession The created session
     */
    public function createStreamableHttpSession(
        string $url,
        array $headers,
        array $options,
        string $sessionId,
    ): ClientSession {
        Log::info("Creating MCP Streamable HTTP session '{$sessionId}' with URL: {$url}");

        $transport = new StreamableHttpTransport($url, $headers, $options);
        return $this->createSession($transport, $sessionId);
    }

    /**
     * Create a session using the provided transport
     *
     * @param TransportInterface $transport The transport to use
     * @param string $sessionId The session ID
     * @return ClientSession The created session
     */
    protected function createSession(
        TransportInterface $transport,
        string $sessionId,
    ): ClientSession {
        $timeout                    = config('mcp.request_timeout', 60 * 1);
        $session                    = new ClientSession($transport, null, $timeout);
        $this->sessions[$sessionId] = $session;
        return $session;
    }

    /**
     * Get a session by ID
     *
     * @param string $sessionId The session ID
     * @return ClientSession|null The session, or null if not found
     */
    public function getSession(string $sessionId): ?ClientSession
    {
        return $this->sessions[$sessionId] ?? null;
    }

    /**
     * Call a tool on an MCP server
     *
     * @param string $serverId The server ID
     * @param string $toolName The tool name
     * @param array|null $arguments The tool arguments
     * @return array The tool result
     * @throws \Exception If the server is not found or the tool call fails
     */
    public function callTool(
        string $serverId,
        string $toolName,
        ?array $arguments = null,
    ): array {
        $session = $this->getSession($serverId);

        if ($session === null) {
            throw new \Exception("MCP server not found: {$serverId}");
        }

        try {
            // Initialize the session if not already initialized
            if (! $session->isInitialized()) {
                $session->initialize();
            }

            // Call the tool
            return $session->callTool($toolName, $arguments);
        } catch (\Exception $e) {
            Log::error(
                "Error calling MCP tool '{$toolName}' on server '{$serverId}': {$e->getMessage()}",
            );
            throw $e;
        }
    }

    /**
     * Read a resource from an MCP server
     *
     * @param string $serverId The server ID
     * @param string $uri The resource URI
     * @return array The resource content
     * @throws \Exception If the server is not found or the resource read fails
     */
    public function readResource(string $serverId, string $uri): array
    {
        $session = $this->getSession($serverId);

        if ($session === null) {
            throw new \Exception("MCP server not found: {$serverId}");
        }

        try {
            // Initialize the session if not already initialized
            if (! $session->isInitialized()) {
                $session->initialize();
            }

            // Read the resource
            return $session->readResource($uri);
        } catch (\Exception $e) {
            Log::error(
                "Error reading MCP resource '{$uri}' from server '{$serverId}': {$e->getMessage()}",
            );
            throw $e;
        }
    }

    /**
     * List available tools on an MCP server
     *
     * @param string $serverId The server ID
     * @return array The list of tools
     * @throws \Exception If the server is not found or the list request fails
     */
    public function listTools(string $serverId): array
    {
        Log::info("Listing tools for MCP server: {$serverId}");
        $session = $this->getSession($serverId);

        if ($session === null) {
            Log::error("MCP server not found: {$serverId}");
            throw new \Exception("MCP server not found: {$serverId}");
        }

        try {
            // Initialize the session if not already initialized
            if (! $session->isInitialized()) {
                Log::info("Initializing MCP session for server: {$serverId}");
                $session->initialize();
            }

            // List the tools
            Log::info("Requesting tools list from MCP server: {$serverId}");
            $tools = $session->listTools();

            Log::info(
                'Received tools list from MCP server: ' .
                    json_encode($tools, JSON_PRETTY_PRINT),
            );
            return $tools;
        } catch (\Exception $e) {
            Log::error(
                "Error listing MCP tools on server '{$serverId}': {$e->getMessage()}",
                [
                    'exception' => $e,
                    'trace'     => $e->getTraceAsString(),
                ],
            );

            // Return empty array instead of throwing the exception
            // This makes it more robust for the TeamChatAgent
            return [];
        }
    }

    /**
     * List available resources on an MCP server
     *
     * @param string $serverId The server ID
     * @return array The list of resources
     * @throws \Exception If the server is not found or the list request fails
     */
    public function listResources(string $serverId): array
    {
        $session = $this->getSession($serverId);

        if ($session === null) {
            throw new \Exception("MCP server not found: {$serverId}");
        }

        try {
            // Initialize the session if not already initialized
            if (! $session->isInitialized()) {
                $session->initialize();
            }

            // List the resources
            return $session->listResources();
        } catch (\Exception $e) {
            Log::error(
                "Error listing MCP resources on server '{$serverId}': {$e->getMessage()}",
            );
            throw $e;
        }
    }

    /**
     * Get all available servers
     *
     * @return array<string, array> Server configurations indexed by server ID
     */
    public function getServers(): array
    {
        return $this->serverConfigs;
    }

    public function getServer($serverId): ?array
    {
        return $this->serverConfigs[$serverId] ?? null;
    }

    /**
     * Close all sessions
     *
     * @return void
     */
    public function closeAll(): void
    {
        foreach ($this->sessions as $sessionId => $session) {
            try {
                $session->close();
            } catch (\Exception $e) {
                Log::error(
                    "Error closing MCP session '{$sessionId}': {$e->getMessage()}",
                );
            }
        }

        $this->sessions = [];
    }

    private function isUnauthorizedError(\Throwable $exception): bool
    {
        $message = $exception->getMessage();
        return str_contains($message, '401 Unauthorized') || 
               str_contains($message, 'HTTP/1.1 401') ||
               $exception->getCode() === 401;
    }
}
