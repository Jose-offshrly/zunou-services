<?php

namespace App\Actions;

use App\Enums\MessageStatus;
use App\Events\AiResponseComplete;
use App\Models\Message;
use App\Models\Task;
use App\Models\Thread;
use App\Models\User;

class CreateTaskListActionsAction
{
    public static function execute(
        string $taskListId,
        Thread $thread,
        User $user,
    ): Message {
        $baseMessage = [
            'organization_id' => $thread->organization_id,
            'thread_id'       => $thread->id,
            'user_id'         => $user->id,
            'status'          => MessageStatus::COMPLETE,
        ];

        $task = Task::findOrFail($taskListId);

        $title = self::removeTaskWordAtTheEnd($task->title);

        $user_message = Message::create([
            'content' => 'Hey Pulse, I need some help with the ' .
                $title .
                ' Tasks. Can you provide any insights, resources, or guidance to get it done efficiently?',
            'role' => 'user',
            ...$baseMessage,
        ]);

        $ai_message = Message::create([
            'content' => json_encode([
                'Task Insights & Updates' => [
                    [
                        'label'  => 'Generate a brief overview of tasks.',
                        'action' => 'Summarize',
                    ],
                    [
                        'label'  => 'Catch up on the latest activity',
                        'action' => 'Get Status',
                    ],
                ],
                'Task Prioritization & Context' => [
                    [
                        'label'  => 'Provide more details or context about the tasks.',
                        'action' => 'Explain',
                    ],
                ],
                'AI Assistance & Next Steps' => [
                    [
                        'label'  => 'Get AI-powered next steps and recommendations.',
                        'action' => 'Need Help',
                    ],
                ],
            ]),
            'role'       => 'assistant',
            'created_at' => $user_message->created_at->copy()->addSecond(),
            'updated_at' => $user_message->updated_at->copy()->addSecond(),
            ...$baseMessage,
        ]);

        AiResponseComplete::dispatch($ai_message);

        return $user_message->refresh();
    }

    private static function removeTaskWordAtTheEnd(string $title): string
    {
        $title = preg_replace('/\s*task(s)?$/i', '', $title);

        return trim($title);
    }
}
