<?php

declare(strict_types=1);

namespace App\GraphQL\Mutations;

use App\Services\MCP\MCPCallbackService;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

readonly class CompleteMCPAuthorization
{
    public function __construct(private MCPCallbackService $mcpCallbackService)
    {
    }

    public function __invoke(null $_, array $args): array
    {
        $user = Auth::user();

        try {
            $code  = $args['code']  ?? null;
            $state = $args['state'] ?? null;

            if (! $code) {
                throw new \Exception('Authorization code is required');
            }

            if (! $state) {
                throw new \Exception('OAuth state is required');
            }

            $result = $this->mcpCallbackService->exchangeCodeForTokens(
                $code,
                $state,
            );

            return [
                'success'   => true,
                'message'   => 'Authorization completed successfully',
                'tokenData' => [
                    'mcpUrl'       => $result['mcpUrl'],
                    'accessToken'  => $result['access_token'],
                    'tokenType'    => $result['token_type'],
                    'expiresIn'    => $result['expires_in'],
                    'refreshToken' => $result['refresh_token'],
                    'scope'        => $result['scope'],
                ],
            ];
        } catch (\Exception $e) {
            Log::error('MCP authorization completion failed', [
                'error'   => $e->getMessage(),
                'args'    => $args,
                'user_id' => $user?->id ?? 'anonymous',
            ]);
            throw $e;
        }
    }
}
