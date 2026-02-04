<?php

declare(strict_types=1);

namespace App\GraphQL\Mutations;

use App\Models\Thread;
use GraphQL\Error\Error;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

final readonly class CreateThreadMutation
{
    /** @param  array{}  $args */
    public function __invoke(null $_, array $args)
    {
        $user = Auth::user();
        if (! $user) {
            throw new Error('No user was found');
        }

        Log::info('args: ' . json_encode($args));

        $payload = $this->threadPayload($args, $user->id);

        // Update all active threads of the same type for the same pulse to inactive
        Thread::where('pulse_id', $args['pulse_id'])
            ->where('user_id', $user->id)
            ->where('type', $args['type'])
            ->where('is_active', true)
            ->update(['is_active' => false]);

        Log::info('payload: ' . json_encode($payload));

        $thread = Thread::create($payload);

        return $thread->refresh();
    }

    private function threadPayload(array $args, string $user_id): array
    {
        $id   = Str::uuid()->toString();
        $type = $args['type'] ?? 'user'; // Should be 'admin' or 'user', default to 'user' if not provided

        return [
            'id'              => $id,
            'name'            => $args['name'],
            'organization_id' => $args['organization_id'],
            'pulse_id'        => $args['pulse_id'],
            'third_party_id'  => $id,
            'user_id'         => $user_id,
            'type'            => $type,
            'is_active'       => true, // new threads will have is_active set to true
        ];
    }
}
