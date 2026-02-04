<?php

declare(strict_types=1);

namespace App\GraphQL\Mutations;

use App\Services\MCP\MCPAuthorizationService;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

readonly class StartMCPAuthorization
{
    public function __construct(private MCPAuthorizationService $mcpAuthService)
    {
    }

    /**
     * Start MCP OAuth authorization flow
     *
     * @param null $_
     * @param array $args
     * @return array
     * @throws \Exception
     */
    public function __invoke(null $_, array $args): array
    {
        $user = Auth::user();

        try {
            $mcpServer = isset($args['mcpServer'])
                ? strtolower($args['mcpServer'])
                : null;
            $redirectUri = $args['redirectUri'] ?? null;

            if (! $mcpServer) {
                throw new \Exception('MCP Server is required');
            }

            if (! $redirectUri) {
                throw new \Exception('MCP redirectUri is required');
            }

            $mcpUrl = config("mcp.servers.{$mcpServer}.url") ?? null;

            if (! $mcpUrl) {
                throw new \Exception('MCP Server is not supported atm');
            }

            if (! filter_var($mcpUrl, FILTER_VALIDATE_URL)) {
                throw new \Exception('Invalid MCP URL format');
            }

            $result = $this->mcpAuthService->startAuthorization(
                $mcpUrl,
                $redirectUri,
            );

            return [
                'authUrl'        => $result['authUrl'],
                'state'          => $result['state'],
                'mcpUrl'         => $result['mcpUrl'],
                'authServerInfo' => $result['authServerInfo'],
            ];
        } catch (\Exception $e) {
            Log::error('MCP Authorization failed', [
                'error'   => $e->getMessage(),
                'args'    => $args,
                'user_id' => $user?->id ?? 'anonymous',
            ]);

            throw $e;
        }
    }
}
