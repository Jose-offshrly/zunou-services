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
use Illuminate\Support\Facades\Log;

class RecordTaskCreatedActivityJob implements ShouldQueue
{
    use Dispatchable;
    use FeedHandler;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    /**
     * Create a new job instance.
     */
    public function __construct(public Task $task, public array $user)
    {
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        $task = $this->task;

        // Skip if the pulse was deleted
        if (! $task->entity || $task->entity->trashed()) {
            return;
        }

        $task->entity->load('members.user');

        foreach ($task->entity->members as $member) {
            $this->recordActivity(
                model: $task,
                properties: [
                    'data'   => $task->toArray(),
                    'causer' => $this->user,
                ],
                description: "Created a new Task about {$task->title} in the {$task->entity->name}",
                feed_type: FeedType::TASK_CREATED->value,
                organization_id: $task->organization_id,
                pulse_id: $task->entity_id,
                receiver_id: $member->user->id,
                user_id: $this->user['id'],
            );
        }

        if (isset($task->assignees)) {
            Log::info(
                'TASK ASSIGNEES: ',
                $task->assignees->pluck('user_id')->toArray(),
            );

            $assignees = $task->assignees->pluck('user_id')->toArray();

            $filteredAssignees = array_values(
                array_filter($assignees, function ($id) {
                    return $id !== $this->user['id'];
                }),
            );

            Log::info('FILTERED ASSIGNEES COUNT:' . count($filteredAssignees));

            if ($filteredAssignees !== null) {
                Log::info(
                    'FILTERED ASSIGNEES:' . ($filteredAssignees !== null),
                );

                foreach ($filteredAssignees as $key => $assignnee) {
                    Log::info('RECORDING ACTIVITY!');
                    $this->recordActivity(
                        model: $task,
                        properties: [
                            'data'   => $task->toArray(),
                            'causer' => $this->user,
                        ],
                        description: "Assigned a new task to you in {$task->entity->name}",
                        feed_type: FeedType::TASK_ASSIGNED->value,
                        organization_id: $task->organization_id,
                        receiver_id: $assignnee,
                        user_id: $this->user['id'],
                    );
                }
            }
        }
    }
}
