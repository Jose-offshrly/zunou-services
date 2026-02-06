<?php

namespace App\Observers;

use App\Jobs\RecordTaskCreatedActivityJob;
use App\Jobs\RecordTaskUpdatedActivityJob;
use App\Models\Task;
use Illuminate\Contracts\Events\ShouldHandleEventsAfterCommit;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class TaskObserver implements ShouldHandleEventsAfterCommit
{
    public function created(Task $task): void
    {
        $user = Auth::user();

        if ($user) {
            $user = $user->only(['id', 'name', 'email', 'gravatar']);

            Log::info('Auth:', $user);
            Log::info('RecordTaskCreatedActivityJob');
            dispatch(
                new RecordTaskCreatedActivityJob(task: $task, user: $user),
            );
        }

        $maxOrder    = Task::where('parent_id', $task->parent_id)->max('order') ?? 0;
        $task->order = $maxOrder + 1;

        $task->saveQuietly();
    }

    public function updated(Task $task)
    {
        $user = Auth::user();

        if ($user) {
            $user = $user->only(['id', 'name', 'email', 'gravatar']);

            $changes = $task->getChanges();
            unset($changes['updated_at']);
            dispatch(
                new RecordTaskUpdatedActivityJob(
                    task: $task,
                    user: $user,
                    changes: $changes,
                ),
            );
        }

        // If this task was just marked as COMPLETED and it has a parent
        if (
            $task->isDirty('status') && $task->status === 'COMPLETED' && $task->parent_id
        ) {
            $parent = $task->parent;

            // Count total children and completed ones
            $total     = $parent->children()->count();
            $completed = $parent
                ->children()
                ->where('status', 'COMPLETED')
                ->count();

            if ($total > 0 && $total === $completed) {
                $parent->update(['status' => 'COMPLETED']);
            }
        }
    }

    public function creating(Task $task)
    {
        if (Auth::check()) {
            $task->author_id = Auth::id();
        }
    }
}