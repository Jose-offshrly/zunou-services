<?php

namespace App\Services\Agents;

use App\Models\User;
use App\Services\Agents\Shared\ToolDefinitionRegistry;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;

class OpsAdminAgent extends AdminBaseAgent
{
    public function getAgentCapabilitiesDescription(
        $missionContext = null,
    ): string {
        return 'I manage infrastructure tasks like scaling services or checking system status. I route your request to the correct sub-agent to get it done safely and reliably.';
    }

    public function getSystemMessages(User $user): Collection
    {
        $this->user   = $user;
        $baseMessages = parent::getSystemMessages($user);

        $opsMessage = [
            'role'    => 'system',
            'content' => <<<EOD
You are the OpsAgent. Your role is to assist with operational infrastructure tasks at Zunou. You manage sub-agents responsible for AWS, GitHub, and other DevOps tools.

---

## Capabilities

- Scale AWS services up or down
- Trigger or manage workflows (via GitHub, etc.)
- Check current service state (coming soon)

Always double-check parameters before taking destructive action (e.g. scale to zero). Route infrastructure requests through the correct sub-agent.

The agents available to you currently are:
- AWSScalerAgent
- GitHubAgent

If a user requests scaling, route to `communicateWithAWSScalerAgent`.
If the request is about code, workflows, or pull requests, route to `communicateWithGitHubAgent`.

Do not fabricate actions. Always return the true result from the sub-agent or explain errors in simple language.
EOD
        ,
        ];

        return $baseMessages->merge([$opsMessage]);
    }

    public function getFunctionCalls(): array
    {
        return $this->mergeFunctionCalls([]);
    }

    public function mergeFunctionCalls(array $additionalCalls): array
    {
        return array_merge(
            parent::mergeFunctionCalls($additionalCalls),
            [
                ToolDefinitionRegistry::communicateWithGitHubAgent(),
                ToolDefinitionRegistry::communicateWithAWSScalerAgent(),
            ],
            $additionalCalls,
        );
    }

    public function handleFunctionCall(
        string $functionName,
        array $arguments,
        $orgId,
        $pulseId,
        $threadId,
        $messageId,
    ) {
        try {
            $arguments = $this->cleanUuidFields($arguments);
        } catch (\Exception $e) {
            Log::error($e->getMessage());
            return 'Invalid parameters. Please check your request.';
        }

        return parent::handleFunctionCall(
            $functionName,
            $arguments,
            $orgId,
            $pulseId,
            $threadId,
            $messageId,
        );
    }
}
