# PHP MCP Client

This is a PHP implementation of the Model Context Protocol (MCP) client, inspired by the Python SDK in the `python-sdk` directory. This implementation allows your PHP applications to connect to MCP servers and use their tools and resources.

## Overview

The MCP client implementation consists of the following components:

- **Types**: Core types for JSON-RPC and MCP protocol
- **Transport**: Transport layer for communication (stdio and SSE)
- **Client**: Client session management
- **Integration**: Integration with the TeamChatAgent

## Configuration

MCP servers are configured in `config/mcp.php`. Example configuration:

```php
// config/mcp.php
return [
    'servers' => [
        'math' => [
            'type' => 'stdio',               // Connection type (stdio or sse)
            'command' => 'npx -y math-mcp --stdio', // Command to execute for stdio
            'description' => 'Basic math operations server',
            'enabled' => true,
        ],
        
        'figma' => [
            'type' => 'stdio',
            'command' => 'npx -y figma-developer-mcp --figma-api-key=YOUR_KEY --stdio',
            'description' => 'Figma integration server',
            'enabled' => true,
        ],
        
        'api-service' => [
            'type' => 'sse',
            'url' => 'https://example.com/mcp-sse',
            'headers' => [
                'Authorization' => 'Bearer YOUR_TOKEN',
            ],
            'description' => 'External API service',
            'enabled' => true,
        ],
    ],
    
    // Default timeout for MCP requests in seconds
    'request_timeout' => 30,
    
    // Whether to log MCP request/response details
    'debug' => env('MCP_DEBUG', false),
];
```

## Usage

### Within TeamChatAgent

The TeamChatAgent has been updated to initialize an MCP client and expose two new tool functions:

1. `useMcpTool`: Call a tool on an MCP server
2. `accessMcpResource`: Access a resource on an MCP server

These tools are automatically available to the TeamChatAgent and can be used like any other tool.

Example in agent prompts:

```
You can use the useMcpTool function to call tools provided by MCP servers. For example:

useMcpTool({
  "server_name": "math",
  "tool_name": "add",
  "arguments": {
    "a": 5,
    "b": 3
  }
})

You can also use the accessMcpResource function to access resources from MCP servers:

accessMcpResource({
  "server_name": "figma",
  "uri": "figma:design/file/abc123"
})
```

### Direct Usage

You can also use the MCP client directly in your PHP code:

```php
use App\Services\MCP\MCPClientManager;

// Create a client manager
$mcpClientManager = new MCPClientManager();

// Get available servers
$servers = $mcpClientManager->getServers();

// Call a tool on a server
$result = $mcpClientManager->callTool('math', 'add', ['a' => 5, 'b' => 3]);

// Access a resource on a server
$resource = $mcpClientManager->readResource('figma', 'figma:design/file/abc123');
```

## Testing

Use the provided test command to test the MCP client. Make sure to run these commands from the `services/api` directory:

```bash
# List available servers
cd services/api
php artisan test:mcp-client --list-servers

# Test a specific server
cd services/api
php artisan test:mcp-client math

# Test a specific tool on a server
cd services/api
php artisan test:mcp-client math add
```

## Adding a New MCP Server

1. Edit `config/mcp.php` to add your new server configuration
2. Stdio servers require the command to execute
3. SSE servers require the URL and optional headers
4. Restart your application if necessary

## Transports

### Stdio Transport

The stdio transport executes a command and communicates with the process via stdin/stdout. This is suitable for local MCP servers.

### SSE Transport

The SSE transport connects to an HTTP endpoint that provides Server-Sent Events (SSE) for receiving messages and uses a POST endpoint for sending messages. This is suitable for remote MCP servers.

## Extending

If you need to add a new transport type, implement the `TransportInterface` and update the `MCPClientManager` to support it.
