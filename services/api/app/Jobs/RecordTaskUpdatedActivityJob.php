<?php

namespace App\Jobs;

use App\Concerns\FeedHandler;
use App\Enums\FeedType;
use App\Models\Task;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class RecordTaskUpdatedActivityJob implements ShouldQueue
{
    use Dispatchable;
    use FeedHandler;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    /**
     * Create a new job instance.
     */
    public function __construct(
        public Task $task,
        public array $user,
        public array $changes,
    ) {
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        $task  = $this->task;
        $dirty = $this->changes;

        $taskId    = $task->id;
        $taskTitle = $task->title;
        if (! empty($dirty)) {
            $changedFields = collect($dirty)
                ->map(function ($newValue, $field) {
                    $label = str_replace('_', ' ', $field);
                    return "{$label} = {$newValue}";
                })
                ->implode(', ');

            $logMessage = "[background] Task updated: '{$taskTitle}' ({$taskId}) (changed: {$changedFields})";
        } else {
            $logMessage = "[background] Task updated: '{$taskTitle}' ({$taskId})";
        }

        $this->recordActivity(
            model: $task,
            properties: [
                'data'   => $task->toArray(),
                'causer' => $this->user,
            ],
            description: $logMessage,
            feed_type: FeedType::TASK_UPDATED->value,
            organization_id: $task->organization_id,
            pulse_id: $task->entity_id,
            receiver_id: null,
            user_id: $this->user['id'],
        );
    }
}
