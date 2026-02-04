<?php

return [
    /*
    |--------------------------------------------------------------------------
    | MCP Server Configurations
    |--------------------------------------------------------------------------
    |
    | This file contains the configuration for MCP (Model Context Protocol) servers.
    | Each server has a unique ID and configuration parameters.
    |
    */

    'servers' => [
        /*
        |--------------------------------------------------------------------------
        | Example server configurations
        |--------------------------------------------------------------------------
        |
        | Uncomment and modify these examples as needed.
        |
        | @params type: Connection type (stdio, streamable-http or sse)
        */

        'github' => [
            'type'        => 'streamable-http',
            'url'         => env('MCP_GITHUB_URL', 'https://api.githubcopilot.com/mcp/'),
            'description' => 'GitHub management manager',
            'enabled'     => true,
        ],
        'slack' => [
            'type'        => 'streamable-http',
            'url'         => env('MCP_SLACK_URL', 'http://localhost:8080/mcp'),
            'description' => 'Slack management manager',
            'enabled'     => true,
        ],
        'jira' => [
            'type'        => 'sse',
            'url'         => env('MCP_JIRA_URL', 'https://mcp.atlassian.com/v1/sse'),
            'description' => 'Jira management manager',
            'enabled'     => true,
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Global Settings
    |--------------------------------------------------------------------------
    */

    // Default timeout for MCP requests in seconds
    'request_timeout' => 30,

    // Whether to log MCP request/response details
    'debug' => env('MCP_DEBUG', false),

    /*
    |--------------------------------------------------------------------------
    | OAuth Configuration
    |--------------------------------------------------------------------------
    |
    | Configuration for OAuth 2.1 authorization flow
    |
    */

    'oauth' => [
        // Default client ID for dynamic registration
        'client_id' => env('MCP_OAUTH_CLIENT_ID', 'mcp-client'),

        // Default scopes for OAuth requests
        'scopes' => env('MCP_OAUTH_SCOPES', 'openid profile email'),

        // OAuth state cache TTL in minutes
        'state_ttl' => env('MCP_OAUTH_STATE_TTL', 30),
    ],
];
