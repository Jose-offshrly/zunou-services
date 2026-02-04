<?php

declare(strict_types=1);

namespace App\GraphQL\Mutations;

use App\Models\Message;
use App\Models\Thread;
use App\Services\CreateCompletionService;

final class GenerateThreadTitleMutation
{
    /** @param  array{}  $args */
    public function __invoke(null $_, array $args)
    {
        $messages = Message::where('thread_id', $args['threadId'])
            ->where('is_system', false)
            ->get();
        $title = CreateCompletionService::generateTitleFromMessages($messages);

        // Update the thread with the generated title
        $thread       = Thread::findOrFail($args['threadId']);
        $thread->name = $title;
        $thread->save();

        return [
            'title' => $title,
        ];
    }
}
