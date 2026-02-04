<?php

declare(strict_types=1);

namespace App\GraphQL\Mutations;

use App\Models\Thread;

final readonly class DeleteThreadMutation
{
    /** @param  array{}  $args */
    public function __invoke(null $_, array $args)
    {
        $thread = Thread::findOrFail($args['id']);

        $thread->save();
        $thread->delete();

        return $thread;
    }
}
