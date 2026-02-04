<?php

namespace App\Services\Agents\SubAgents;

use App\Contracts\ThreadInterface;
use App\Models\Message;
use App\Models\Pulse;
use App\Models\SystemMessage;
use App\Models\SystemThread;
use App\Models\Thread;
use App\Models\User;
use App\Services\Agents\AdminBaseAgent;
use App\Services\MessageProcessingService;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class PulseAgent extends BaseSubAgent implements SubAgentInterface
{
    protected $targetPulse;
    protected $availablePulses;
    protected $parentThreadId;

    public function __construct($pulse, $targetPulseId = null)
    {
        parent::__construct($pulse);
        
        $this->availablePulses = Pulse::where('organization_id', $pulse->organization_id)
            ->select('id', 'name', 'description')
            ->get()
            ->keyBy('id');
        
        if ($targetPulseId) {
            $this->targetPulse = $this->availablePulses->get($targetPulseId);
        }
    }

    public function processSystemThread(
        string $taskType,
        string $message,
        User $user,
        string $orgId,
        string $pulseId,
        string $parentThreadId,
        ?array $responseSchema = null,
        ?string $parentMessageId = null,
    ): string {
        $this->parentThreadId = $parentThreadId;
        return parent::processSystemThread($taskType, $message, $user, $orgId, $pulseId, $parentThreadId);
    }

    public function getSystemPrompt(): string
    {
        $sharedPrompt = $this->getSharedPrompt();
        
        $targetPulseInfo = $this->targetPulse 
            ? "You are communicating with the pulse: {$this->targetPulse->name}"
            : "You can communicate with other pulses in the organization";

        $availablePulses = $this->getAvailablePulsesList();

        return <<<EOD
{$sharedPrompt}

## Pulse Agent

{$targetPulseInfo}

Your role is to route queries to other pulses and return their responses.
When calling another pulse, pass the full user message to ensure context is preserved.

IMPORTANT: When you receive a response from another pulse:
- If the response is in JSON format with UI elements (like references, options, etc.), return it EXACTLY as received
- Do not modify, summarize, or reformat JSON responses
- Preserve all UI elements including references, IDs, and metadata

{$availablePulses}
EOD;
    }

    protected function getAvailablePulsesList(): string
    {
        if ($this->availablePulses->isEmpty()) {
            return "No pulses available in this organization.";
        }

        $pulseList = $this->availablePulses->map(function ($pulse) {
            $desc = $pulse->description ? " - {$pulse->description}" : '';
            return "- {$pulse->name} (ID: {$pulse->id}){$desc}";
        })->join("\n");

        return "Available Pulses:\n{$pulseList}";
    }

    public function getFunctionCalls(): array
    {
        $adminAgent = new AdminBaseAgent($this->pulse);
        $adminFunctions = $adminAgent->getFunctionCalls();
        
        return $this->mergeFunctionCalls(array_merge($adminFunctions, [
            [
                'type'     => 'function',
                'function' => [
                    'name'        => 'callPulse',
                    'description' => 'Send a message to another pulse and get its response. You can specify the pulse by name or ID.',
                    'parameters'  => [
                        'type'       => 'object',
                        'properties' => [
                            'pulse_name' => [
                                'type'        => 'string',
                                'description' => 'The name of the pulse to communicate with',
                            ],
                            'message' => [
                                'type'        => 'string',
                                'description' => 'The message to send to the pulse',
                            ],
                        ],
                        'required' => ['pulse_name', 'message'],
                    ],
                ],
            ],
        ]));
    }

    public function handleFunctionCall(
        string $functionName,
        array $arguments,
        $orgId,
        $pulseId,
        $threadId,
        $messageId,
    ): string {
        Log::info('[PulseAgent] Handling function call', [
            'function' => $functionName,
            'arguments' => $arguments,
        ]);

        if ($functionName === 'callPulse') {
            return $this->callPulse(
                $arguments['pulse_name'],
                $arguments['message'],
                $orgId
            );
        }

        return parent::handleFunctionCall($functionName, $arguments, $orgId, $pulseId, $threadId, $messageId);
    }

    protected function callPulse(
        string $pulseName,
        string $message,
        string $orgId
    ): string {
        try {
            $targetPulse = $this->availablePulses->first(function ($pulse) use ($pulseName) {
                return stripos($pulse->name, $pulseName) !== false || $pulse->id === $pulseName;
            });
            
            if (! $targetPulse) {
                return "Error: Pulse '{$pulseName}' not found in your organization.";
            }

            Log::info('[PulseAgent] Calling pulse', [
                'target_pulse' => $targetPulse->name,
                'message' => $message,
            ]);

            $targetPulseModel = Pulse::find($targetPulse->id);
            $agent = new AdminBaseAgent($targetPulseModel);
            
            $tempThreadId = Str::uuid()->toString();
            
            $targetThread = Thread::create([
                'id' => $tempThreadId,
                'name' => 'Temporary Cross-Pulse Thread',
                'organization_id' => $orgId,
                'pulse_id' => $targetPulseModel->id,
                'user_id' => $this->user->id,
                'type' => 'admin',
                'third_party_id' => $tempThreadId,
                'is_active' => false,
            ]);
            
            $messages = collect([[
                'role' => 'user',
                'content' => $message
            ]]);
            
            $response = app(MessageProcessingService::class)->processMessages(
                $messages,
                $targetThread,
                $agent,
                $this->user,
                Str::uuid(),
            );
            
            if ($agent->hasToolResponseFormat()) {
                $this->setCurrentToolResponseFormat(
                    $agent->currentToolName,
                    $agent->currentToolResponseFormat,
                );
            } elseif ($agent->responseSchema) {
                $this->currentToolResponseFormat = $agent->responseSchema;
                $this->currentToolName = 'callPulse';
            }
            
            $this->cleanupTempThread($targetThread);
            
            return $response;
        } catch (\Throwable $e) {
            Log::error('[PulseAgent] Error calling pulse', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            
            return "Error calling pulse: {$e->getMessage()}";
        }
    }

    public function processMessage(
        Collection $messages,
        ThreadInterface $thread,
        User $user,
        string $messageId,
        ?array $responseSchema = null,
    ): string {
        $this->user = $user;
        
        return parent::processMessage(
            $messages,
            $thread,
            $user,
            $messageId,
        );
    }

    protected function cleanupTempThread(Thread $thread): void
    {
        Message::where('thread_id', $thread->id)->delete();

        $systemThread = SystemThread::where('parent_thread_id', $thread->id)->first();

        if ($systemThread) {
            SystemMessage::where('system_thread_id', $systemThread->id)->delete();
            $systemThread->delete();
        }

        $thread->delete();
    }
}