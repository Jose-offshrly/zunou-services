<?php

namespace App\Services;

use App\Models\Thread;
use App\Models\User;
use App\Services\Agents\BaseAgent;
use Illuminate\Support\Collection;

class MessageProcessingService
{
    protected $openAI;
    protected static $instance;

    public function __construct()
    {
        $this->openAI = \OpenAI::client(config('zunou.openai.api_key'));
    }

    public static function getInstance(): self
    {
        if (! isset(self::$instance)) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    public function processMessages(
        Collection $messages,
        Thread $thread,
        BaseAgent $agent,
        User $user,
        string $messageId,
    ): string {
        return $agent->processMessage($messages, $thread, $user, $messageId);
    }

    public function formatMessages($allMessages): array
    {
        // Ensure $allMessages is treated as an indexed array
        $allMessages = $allMessages->values();

        //Log::info('allMessages: ' . json_encode($allMessages));

        return $allMessages
            ->map(function ($message) {
                // Apply the check only if the role is 'user'
                $role = $message['role'] === 'file' ? 'user' : $message['role'];
                if (
                    $role === 'user' && empty($message['content']) && empty($message['tool_calls'])
                ) {
                    return null;
                }

                $result = [
                    'role'    => $role,
                    'content' => $message['content'] ?? null,
                ];

                if (isset($message['tool_calls'])) {
                    $result['tool_calls'] = $message['tool_calls'];
                }

                if (isset($message['tool_call_id'])) {
                    $result['tool_call_id'] = $message['tool_call_id'];
                }

                return $result;
            })
            ->filter() // Remove any null values from the collection
            ->values() // Reset keys to ensure it is a proper array
            ->toArray();
    }
}
