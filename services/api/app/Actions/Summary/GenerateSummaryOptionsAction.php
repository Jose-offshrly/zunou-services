<?php

namespace App\Actions\Summary;

use App\Enums\MessageStatus;
use App\Events\AiResponseComplete;
use App\Models\Message;
use App\Models\Summary;
use App\Models\Thread;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

readonly class GenerateSummaryOptionsAction
{
    public function __construct(
        private Summary $summary,
        private Thread $thread,
    ) {
    }

    public function handle(): Message
    {
        return DB::transaction(function () {
            $message = Message::create([
                'content'         => $this->content()->toJson(),
                'organization_id' => $this->thread->organization_id,
                'role'            => 'assistant',
                'thread_id'       => $this->thread->id,
                'user_id'         => $this->thread->user_id,
                'status'          => MessageStatus::COMPLETE,
            ]);

            AiResponseComplete::dispatch($message); // channel: thread.{id}, temporary public channel for testing

            return $message->refresh();
        });
    }

    private function content(): Collection
    {
        $content = [
            'type'    => 'summary_options',
            'message' => "Hi, {$this->thread->user->name}! Here are the latest {$this->summary->name} notes.
                I’ve summarized key points that might be relevant to you.
                How would you like to receive the summary?",
            'options' => [
                'text_summary' => [
                    [
                        'label'      => 'Chat Summary',
                        'prompt'     => 'Summarize the key highlights of the meeting in a chat format',
                        'summary_id' => $this->summary->id,
                        'status'     => 'available',
                    ],
                    [
                        'label'  => 'Formatted Report',
                        'prompt' => 'Summarize the key highlights of the meeting in a well-structured and formatted report',
                        'status' => 'available',
                    ],
                ],
                'audio_summary' => [
                    [
                        'label'  => 'Podcast Format',
                        'prompt' => '',
                        'status' => 'coming_soon',
                    ],
                    [
                        'label'  => 'Voice Note',
                        'prompt' => '',
                        'status' => 'coming_soon',
                    ],
                ],
                'video_summary' => [
                    [
                        'label'  => 'Highlights Summary',
                        'prompt' => '',
                        'status' => 'coming_soon',
                    ],
                    [
                        'label'  => 'Full Version',
                        'prompt' => '',
                        'status' => 'coming_soon',
                    ],
                ],
            ],
        ];

        return collect($content);
    }
}
