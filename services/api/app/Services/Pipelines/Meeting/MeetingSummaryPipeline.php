<?php

namespace App\Services\Pipelines\Meeting;

use App\Models\Thread;
use App\Models\User;
use App\Services\Pipelines\AbstractPipeline;
use App\Services\Pipelines\Meeting\Steps\CreateSummaryStep;
use App\Services\Pipelines\Meeting\Steps\IdentifyMeetingStep;
use Illuminate\Support\Collection;

class MeetingSummaryPipeline extends AbstractPipeline
{
    public function __construct()
    {
        $this->steps = [
            new IdentifyMeetingStep(),
            new CreateSummaryStep(),
        ];
    }

    protected function initializeContext(
        Collection $messages,
        Thread $thread,
        User $user,
        string $message,
    ): void {
        if (!$thread->relationLoaded('pulse')) {
            $thread->load('pulse');
        }

        $this->context = MeetingSummaryContext::from([
            'messages' => $messages,
            'thread' => $thread,
            'user' => $user,
            'message' => $message,
            'organization_id' => $thread->organization_id ?? '',
            'pulse_id' => $thread->pulse_id,
            'success' => true,
            'error' => '',
            'result' => null,
            'pulse' => $thread->pulse,
            'meeting_info' => null,
        ]);
    }
}

