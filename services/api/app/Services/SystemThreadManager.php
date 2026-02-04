<?php

namespace App\Services;

use App\Models\ReplyTeamThread;
use App\Models\SystemMessage;
use App\Models\SystemThread;
use App\Models\TeamChatSystemMessage;
use App\Models\TeamChatSystemThread;
use App\Models\TeamThread;
use App\Models\Thread;

class SystemThreadManager
{
    public ReplyTeamThread|TeamThread|Thread $thread;
    public string $SystemThread;
    public string $SystemMessage;

    public function __construct(ReplyTeamThread|TeamThread|Thread $thread)
    {
        $this->thread = $thread;
        $this->determineThreadType();
    }

    private function determineThreadType()
    {
        if (
            $this->thread instanceof ReplyTeamThread or $this->thread instanceof TeamThread
        ) {
            $this->SystemThread  = TeamChatSystemThread::class;
            $this->SystemMessage = TeamChatSystemMessage::class;
        } else {
            $this->SystemThread  = SystemThread::class;
            $this->SystemMessage = SystemMessage::class;
        }
    }

    public function firstOrNew(array $threadData)
    {
        return $this->SystemThread::firstOrNew($threadData);
    }

    public function addMessage(array $message)
    {
        return $this->SystemMessage::create($message);
    }

    public function getMessages()
    {
        return $this->SystemMessage::where('system_thread_id', $this->thread->id)
            ->orderBy('id', 'asc')
            ->get();
    }
}
