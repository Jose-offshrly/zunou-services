<?php

declare(strict_types=1);

namespace App\GraphQL\Mutations;

use App\Actions\CreateTaskListActionsAction;
use App\Models\Thread;
use GraphQL\Error\Error;
use Illuminate\Support\Facades\Auth;

final readonly class CreateAssistantTaskListActionsMutation
{
    /** @param  array{}  $args */
    public function __invoke(null $_, array $args)
    {
        $user = Auth::user();
        if (! $user) {
            throw new error('No user was found');
        }

        $thread = Thread::findOrFail($args['threadId']);

        $user_message = CreateTaskListActionsAction::execute(
            $args['taskListId'],
            $thread,
            $user,
        );

        return $user_message;
    }
}
