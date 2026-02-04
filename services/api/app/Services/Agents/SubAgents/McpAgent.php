<?php

namespace App\Services\Agents\SubAgents;

use App\Contracts\ThreadInterface;
use App\Models\User;
use App\Services\MCP\MCPIntegration;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;

class McpAgent extends BaseSubAgent implements SubAgentInterface
{
    public MCPIntegration $mcpIntegration;

    public function __construct($pulse, MCPIntegration $mcpIntegration)
    {
        parent::__construct($pulse);
        $this->mcpIntegration = $mcpIntegration;
    }

    public function getSystemPrompt(): string
    {
        return $this->mcpIntegration->getSystemPrompt();
    }

    public function getFunctionCalls(): array
    {
        return $this->mergeFunctionCalls([]);
    }

    protected function mergeFunctionCalls(array $additionalCalls): array
    {
        try {
            $tools = $this->mcpIntegration->getTools() ?? [];
            Log::info("Tools for " . $this->mcpIntegration->agent->name, ["tools" => $tools]);
        } catch (\Throwable $e) {
            Log::error("Error getting tools for " . $this->mcpIntegration->agent->name, ["error" => $e->getMessage()]);
            $tools = [];
        }

        return $tools;
    }

    public function getResponseSchema(): ?array
    {
        return $this->mcpIntegration->getResponseSchema();
    }

    public function handleFunctionCall(
        string $functionName,
        array $arguments,
        $orgId,
        $pulseId,
        $threadId,
        $messageId,
    ): string {
        Log::info(
            "[{$this->mcpIntegration->agent->name}] {$functionName} called",
            $arguments,
        );

        if ($this->isCustomTool($functionName)) {
            try {
                $result = $this->mcpIntegration->handleCustomFunctionCall($functionName, $arguments);

                return json_encode($result);
            } catch (\Throwable $th) {
                Log::error("error calling custom tool", ["error" => $th->getMessage(), 'stack' => $th->getTraceAsString()]);
                return 'error calling tool';
            }
        }

        try {
            $timeout = 60 * 5;
            $result  = $this->mcpIntegration->session->callTool(
                $functionName,
                $arguments,
                $timeout,
            );
            return json_encode($result['content']);
        } catch (\Throwable $th) {
            Log::error($th->getMessage());
            return 'error calling tool';
        }
    }

    private function isCustomTool(string $functionName): bool
    {
        return in_array($functionName, collect($this->mcpIntegration->getCustomTools())->pluck('function.name')->toArray());
    }

    public function processMessage(
        Collection $messages,
        ThreadInterface $thread,
        User $user,
        string $messageId,
        ?array $responseSchema = null,
    ): string {
        $last = $messages->last();

        return $this->processSystemThread(
            $this->mcpIntegration->agent->name,
            $messages->last()['content'] ?? '',
            $user,
            $thread->organization_id,
            $thread->pulse_id,
            $thread->id,
            $responseSchema,
        );
    }
}
