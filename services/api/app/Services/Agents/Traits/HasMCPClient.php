<?php

namespace App\Services\Agents\Traits;

use App\Services\MCP\Client\ClientSession;
use App\Services\MCP\MCPClientManager;

trait HasMCPClient
{
    protected function getMCPClient(string $serverName): ClientSession
    {
        $mcpClientManager = new MCPClientManager();
        $jiraServer       = $mcpClientManager->getServer($serverName);

        $headers = $jiraServer['headers'] ?? [];
        $session = $mcpClientManager->createSSESession(
            $jiraServer['url'],
            $headers,
            $serverName,
        );
        $session->initialize();

        return $session;
    }

    protected function transformInputToOpenAITool($tools)
    {
        return array_map(function ($tool) {
            $parameters = $tool['inputSchema'];
            if (empty($parameters["properties"])) {
                $parameters["properties"] = (object)[];
            }
            return [
                'type'     => 'function',
                'function' => [
                    'name'        => $tool['name'],
                    'description' => $tool['description'],
                    'parameters'  => $parameters,
                ],
            ];
        }, $tools);
    }
}
