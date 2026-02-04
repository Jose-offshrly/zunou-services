<?php

declare(strict_types=1);

namespace App\GraphQL\Mutations;

use App\Actions\CreateAiMessageAction;
use App\Enums\MessageStatus;
use App\Jobs\CreateTemporaryMessageJob;
use App\Models\LiveInsightOutbox;
use App\Models\Message;
use App\Models\Thread;
use App\Models\User;
use GraphQL\Error\Error;
use Illuminate\Support\Facades\Auth;


final readonly class CreateInsightsCompletionMutation
{
    /** @param  array{}  $args */
    public function __invoke(null $_, array $args)
    {
        $user = Auth::user();
        if (! $user) {
            throw new error('No user was found');
        }

        $insight = LiveInsightOutbox::findOrFail($args['insightId']);

        // Admins (or M2M users) can impersonate other users. (Keep from original completion mutation)
        if (isset($args['userId']) && $user->hasPermission('admin:users')) {
            $user = User::find($args['userId']);
        }

        $metadata = [];

        if (isset($args['metadata']) && ! empty($args['metadata'])) {
            $metadata = json_decode($args['metadata'], true);
        }

        $metadata['insightId'] = $args['insightId'];

        $uniqueThreadKey = $insight->organization_id . ':' . $insight->pulse_id . ':' . $insight->id;

        $thread = Thread::firstOrCreate([
            'organization_id' => $args['organizationId'],
            'third_party_id' => $uniqueThreadKey,
        ],[
            'name' => $insight->topic,
            'user_id' => $user->id,
            'pulse_id' => $insight->pulse_id,
            'type' => 'live_insights',
        ]);

        $now = now();

        $payload = [
            'content'         => $args['message'],
            'organization_id' => $args['organizationId'],
            'role'            => 'user',
            'thread_id'       => $thread->id,
            'user_id'         => $user->id,
            'status'          => MessageStatus::COMPLETE,
            'metadata'        => $metadata,
            'created_at'      => $now,
            'updated_at'      => $now,
        ];

        $message = Message::create($payload);

        $ai_message = CreateAiMessageAction::execute(
            organizationId: $args['organizationId'],
            thread: $thread,
            user: $user,
            created_at: $now->copy()->addSecond(1),
        );

        CreateTemporaryMessageJob::dispatch($message, $thread->pulse_id);

        return [$message->refresh(), $ai_message];
    }
}
