<?php

namespace App\Services\Agents\SubAgents;

use App\Models\DirectMessageThread;
use Illuminate\Support\Facades\Log;
use App\Models\User;

class DirectMessagesChatAgent extends BaseSubAgent implements SubAgentInterface
{

    public function getSystemPrompt(): string
    {
        $basePrompt = $this->getSharedPrompt();

        return <<<EOD
You are the **Direct Messages Chat Agent**.

Your primary responsibility is to assist users with their direct (private) messages within the organization. You help users view, manage, and respond to their direct messages in a clear, secure, and user-friendly manner.

EOD;
    }

    public function getFunctionCalls(): array
    {
        return $this->mergeFunctionCalls([
            [
                'type'     => 'function',
                'function' => [
                    'name'        => 'getUnreadDMs',
                    'description' => 'Get the unread direct messages for the user.',
                    'parameters'  => [
                        'type'       => 'object',
                        'properties' => (object) [],
                        'required' => [],
                    ],
                ],
            ],
        ]);
    }

    /**
     * Handle function calls specific to Admin agents.
     *
     * @param string $functionName
     * @param array $arguments
     * @param mixed $orgId
     * @param mixed $pulseId
     * @param mixed $threadId
     * @param mixed $messageId
     * @return string
     *
     */

    public function handleFunctionCall(
        string $functionName,
        array $arguments,
        $orgId,
        $pulseId,
        $threadId,
        $messageId,
    ): string {
        Log::info("[Direct Messages Chat Agent] {$functionName}  called", $arguments);

        switch ($functionName) {
            case 'getUnreadDMs':
                try {
                    $userId = $this->user->id;

                    $threadsWithUnreadMessages = DirectMessageThread::with([
                        'directMessages' => function ($query) use ($userId) {
                            $query->whereDoesntHave('reads', function ($readQuery) use ($userId) {
                                $readQuery->where('user_id', $userId);
                            });
                        },
                    ])
                        ->where("organization_id", $orgId)
                        ->get()
                        ->filter(function ($thread) {
                            return $thread->directMessages->isNotEmpty();
                        });

                    $threadsWithUnreadMessages = $threadsWithUnreadMessages->map(function ($thread) use ($userId) {
                        $otherIds = array_filter(
                            $thread->participants,
                            fn ($id) => $id != $userId,
                        );
                        $otherId = reset($otherIds);
                        $sender = "Unknown";
                        if ($otherId) {
                            $otherParticipant = User::find($otherId);
                            if ($otherParticipant) {
                                $sender = $otherParticipant->name;
                            } else {
                                Log::debug("Other participant not found", [
                                    'otherId' => $otherId,
                                    'otherIds' => $otherIds,
                                ]);
                            }
                        }
                        return  [
                            "sender" => $sender,
                            "message_count" => $thread->directMessages->count(),
                        ];
                    });

                    return json_encode($threadsWithUnreadMessages);
                } catch (\Throwable $th) {
                    Log::error("[Direct Messages Chat Agent] Error getting unread DMs", [
                        'error' => $th->getMessage(),
                        'trace' => $th->getTraceAsString(),
                    ]);
                    return "No unread DMs found";
                }
            default:
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
}
