<?php

namespace App\Console\Commands;

use App\Services\MCP\MCPClientManager;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

/**
 * Test the MCP client implementation by connecting to a server and calling a tool
 */
class TestMcpClient extends Command
{
    /**
     * Log handler for console output
     */
    protected function enableConsoleLogging(): void
    {
        Log::listen(function ($event) {
            $level   = $event->level;
            $message = $event->message;
            $context = $event->context;

            $levelMap = [
                'debug'     => 'comment',
                'info'      => 'info',
                'notice'    => 'info',
                'warning'   => 'warn',
                'error'     => 'error',
                'critical'  => 'error',
                'alert'     => 'error',
                'emergency' => 'error',
            ];

            $method = $levelMap[$level] ?? 'line';

            // Format context if available
            $contextStr = '';
            if (! empty($context)) {
                $contextStr = ' ' .
                    json_encode(
                        $context,
                        JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE,
                    );
            }

            $this->$method("[{$level}] {$message}{$contextStr}");
        });
    }
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'test:mcp-client {server? : The MCP server ID to test} {tool? : The tool name to test} {--list-servers : List available MCP servers}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Test the MCP client by connecting to a server and calling a tool';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Testing MCP Client...');

        // Enable debug logging to console
        $this->enableConsoleLogging();

        // Create MCP client manager
        $mcpClientManager = new MCPClientManager();

        // List servers if requested
        if ($this->option('list-servers')) {
            $servers = $mcpClientManager->getServers();

            if (empty($servers)) {
                $this->warn(
                    'No MCP servers configured. Please add server configurations to config/mcp.php',
                );
                return 1;
            }

            $this->info('Available MCP servers:');
            foreach ($servers as $serverId => $config) {
                $type        = $config['type']        ?? 'unknown';
                $description = $config['description'] ?? 'No description';
                $enabled     = isset($config['enabled']) && $config['enabled']
                        ? 'Enabled'
                        : 'Disabled';

                $this->line(
                    "- {$serverId} ({$type}): {$description} [{$enabled}]",
                );
            }

            return 0;
        }

        // Get server ID from argument or prompt
        $serverId = $this->argument('server');
        if (! $serverId) {
            $servers = $mcpClientManager->getServers();

            if (empty($servers)) {
                $this->error(
                    'No MCP servers configured. Please add server configurations to config/mcp.php',
                );
                return 1;
            }

            $serverId = $this->choice(
                'Select an MCP server to test',
                array_keys($servers),
                null,
            );
        }

        // Get the session for the server
        $session = $mcpClientManager->getSession($serverId);

        if (! $session) {
            $this->error("Failed to get session for server: {$serverId}");
            return 1;
        }

        // Initialize the session
        try {
            $this->info("Initializing session for server: {$serverId}");
            $capabilities = $session->initialize();
            $this->info(
                'Session initialized with capabilities: ' .
                    json_encode($capabilities, JSON_PRETTY_PRINT),
            );
        } catch (\Exception $e) {
            $this->error('Failed to initialize session: ' . $e->getMessage());
            return 1;
        }

        // List available tools
        try {
            $this->info("Listing available tools on server: {$serverId}");
            $tools = $mcpClientManager->listTools($serverId);

            if (empty($tools)) {
                $this->warn("No tools available on server: {$serverId}");
                return 0;
            }

            $this->info('Available tools:');
            if (isset($tools['tools']) && is_array($tools['tools'])) {
                foreach ($tools['tools'] as $tool) {
                    $name        = $tool['name']        ?? 'Unknown';
                    $description = $tool['description'] ?? 'No description';

                    $this->line("- {$name}: {$description}");
                }
            } else {
                // Handle other tool list formats
                foreach ($tools as $key => $tool) {
                    if (is_array($tool) && isset($tool['name'])) {
                        $name        = $tool['name'];
                        $description = $tool['description'] ?? 'No description';
                        $this->line("- {$name}: {$description}");
                    } elseif (
                        is_string($key) && (is_string($tool) || is_array($tool))
                    ) {
                        $description = is_string($tool) ? $tool : 'Available';
                        $this->line("- {$key}: {$description}");
                    }
                }
            }
        } catch (\Exception $e) {
            $this->error('Failed to list tools: ' . $e->getMessage());
            return 1;
        }

        // Call a tool if requested
        $toolName = $this->argument('tool');
        if ($toolName) {
            try {
                $this->info("Calling tool: {$toolName}");

                // Ask for arguments if needed
                $arguments = null;
                if (
                    $this->confirm(
                        'Would you like to provide arguments for the tool?',
                        true,
                    )
                ) {
                    // Show example of expected JSON format based on the tool
                    $this->info(
                        'Enter arguments as JSON. For example: {"a": 5, "b": 3}',
                    );
                    $argumentsJson = $this->ask('Enter arguments as JSON');

                    try {
                        $arguments = json_decode(
                            $argumentsJson,
                            true,
                            512,
                            JSON_THROW_ON_ERROR,
                        );

                        if (! is_array($arguments)) {
                            $this->error(
                                'Arguments must be a JSON object (associative array)',
                            );
                            return 1;
                        }
                    } catch (\JsonException $e) {
                        $this->error('Invalid JSON: ' . $e->getMessage());
                        $this->line(
                            'Make sure to use valid JSON format with double quotes. Example: {"a": 5, "b": 3}',
                        );
                        return 1;
                    }
                }

                // Call the tool
                $result = $mcpClientManager->callTool(
                    $serverId,
                    $toolName,
                    $arguments,
                );

                $this->info('Tool result:');
                $this->line(
                    is_string($result)
                        ? $result
                        : json_encode($result, JSON_PRETTY_PRINT),
                );
            } catch (\Exception $e) {
                $this->error('Failed to call tool: ' . $e->getMessage());
                return 1;
            }
        }

        $this->info('MCP Client test completed successfully.');
        return 0;
    }
}
