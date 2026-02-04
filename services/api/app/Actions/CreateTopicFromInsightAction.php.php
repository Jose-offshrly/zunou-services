<?php 


namespace App\Actions;

use App\Enums\MessageStatus;
use App\Events\AiResponseComplete;
use App\Models\Message;
use App\Models\Thread;
use App\Models\Topic;
use Illuminate\Support\Str;

class CreateTopicFromInsightAction
{
    public static function execute(Topic $topic, Thread $mainThread, Thread $thread)
    {
        $messageContent = json_encode([
            'message' => 'A new topic has been created: ' . $topic->name,
            'ui' => [
                'type' => 'new_topic',
                'topic' => [
                    [
                        'topic_name' => $topic->name,
                        'topic_message_count' => 0,
                        'participants' => [],
                        'created_by' => $topic->creator->name,
                        'latest_messages' => [],
                    ],
                ],
            ],
        ]);

        $aiMessage = Message::create([
            'content'         => $messageContent,
            'organization_id' => $thread->organization_id,
            'role'            => 'assistant',
            'thread_id'       => $mainThread->id,
            'thread_id'       => $thread->id,
            'topic_id'        => $topic->id,
            'user_id'         => $topic->creator->id,
            'status'          => MessageStatus::COMPLETE->value,
        ]);

        AiResponseComplete::dispatch($aiMessage);

        $firstName = Str::of($topic->creator->name)->before(' ');
        $welcomeMessage = json_encode([
            "message" => "Hi " . $firstName . "! The " . $topic->name . " seems like a key project. Would you like me to explain what progress has been made and how it impacts the app’s event capabilities?",
            "ui" => [
                "type" => "options",
                "options" => [
                    [
                        "label" => "Explain",
                        "suggested_reply" => "Explain the topic: " . $topic->name,
                        "option_context" => [
                            "description" => "Content & Background",
                        ],
                    ],
                    [
                        "label" => "Recommendations",
                        "suggested_reply" => "Give recommendations for this topic: " . $topic->name,
                        "option_context" => [
                            "description" => "Here's what I'd recommend next",
                        ],
                    ],
                ],
            ],
        ]);

        Message::create([
            'content'         => $welcomeMessage,
            'organization_id' => $thread->organization_id,
            'role'            => 'assistant',
            'thread_id'       => $thread->id,
            'topic_id'        => $topic->id,
            'user_id'         => $topic->creator->id,
            'status'          => MessageStatus::COMPLETE->value,
        ]);
    }
}