<?php

namespace App\Services\Agents\SubAgents;

use App\Models\User;

interface SubAgentInterface
{
    public function getSystemPrompt(): string;

    public function setAllowedTools(array $tools): void;

    public function getFunctionCalls(): array;

    public function handleFunctionCall(
        string $functionName,
        array $arguments,
        string $orgId,
        string $pulseId,
        string $threadId,
        ?string $messageId,
    ): string;

    public function processSystemThread(
        string $taskType,
        string $message,
        User $user,
        string $orgId,
        string $pulseId,
        string $parentThreadId,
    ): string;
}
