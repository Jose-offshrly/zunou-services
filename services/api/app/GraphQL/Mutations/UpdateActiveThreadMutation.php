<?php

declare(strict_types=1);

namespace App\GraphQL\Mutations;

use App\Models\Thread;

final readonly class UpdateActiveThreadMutation
{
    public function __invoke(null $_, array $args)
    {
        $prevThread = Thread::find($args['threadId']);

        $pulse = $prevThread->pulse;
        $user = $prevThread->user;

        $activeThread = Thread::forUser($user->id)
            ->forPulse($pulse->id)
            ->whereActive(true)
            ->orderBy('updated_at', 'desc')
            ->first();

        if ($activeThread) {
            Thread::where('id', $activeThread->id)->delete();
            $prevThread->update(['is_active' => true]);

            return $prevThread->refresh();
        } else {
            // raise exception
            throw new \Exception(
                'No active thread found for the user in this pulse.'
            );
        }
    }
}
