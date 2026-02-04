<?php

namespace App\Services\MCP;

use App\Models\AiAgent;
use App\Models\User;

class MCPFactory
{
    /**
     * Map agent names to their corresponding MCP handler classes.
     * Add new MCPs here as needed.
     */
    protected static array $agentClassMap = [
        'Github' => \App\Services\MCP\GithubMCP::class,
        // 'AnotherMCP' => \App\Services\MCP\AnotherMCP::class,
    ];

    /**
     * Create an MCP handler instance for the given AiAgent.
     *
     * @param AiAgent $agent
     * @return mixed
     * @throws \Exception
     */
    public static function make(AiAgent $agent, User $user)
    {
        $agentName = $agent->name;

        if (! isset(self::$agentClassMap[$agentName])) {
            throw new \Exception(
                "MCP handler not found for agent: {$agentName}",
            );
        }

        $mcpClass = self::$agentClassMap[$agentName];

        return new $mcpClass($agent, $user);
    }
}
