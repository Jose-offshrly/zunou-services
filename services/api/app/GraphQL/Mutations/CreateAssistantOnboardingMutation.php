<?php

declare(strict_types=1);

namespace App\GraphQL\Mutations;

use App\Models\Message;
use App\Models\Thread;
use App\Services\Agents\HRAdminAgent;
use App\Services\MessageProcessingService;
use GraphQL\Error\Error;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

final readonly class CreateAssistantOnboardingMutation
{
    protected MessageProcessingService $messageProcessor;

    public function __construct(MessageProcessingService $messageProcessor)
    {
        $this->messageProcessor = $messageProcessor;
    }

    /** @param  array{}  $args */
    public function __invoke(null $_, array $args)
    {
        Log::info('CreateAssistantOnboardingMutation', $args);
        $user = Auth::user();
        if (! $user) {
            throw new error('No user was found');
        }

        $id      = Str::uuid()->toString();
        $payload = [
            'id'              => $id,
            'name'            => 'New onboarding thread',
            'organization_id' => $args['organizationId'],
            'third_party_id'  => $id,
            'type'            => 'admin',
            'user_id'         => $user->id,
        ];

        // create thread
        $thread = Thread::create($payload);

        // Initialize onboarding message to start the conversation
        $initialMessages = collect([
            [
                'role'            => 'user',
                'content'         => 'Hello, let’s do some onboarding',
                'organization_id' => $args['organizationId'],
                'thread_id'       => $thread->id,
            ],
        ]);

        // Initialize HRAdminAgent for onboarding tasks
        $agent = new HRAdminAgent();

        // Use MessageProcessingService to handle the message processing loop
        $reply = $this->messageProcessor->processMessages(
            $initialMessages,
            $thread,
            $agent,
            $user,
        );

        // Record assistant's initial response in the Message model
        Message::create([
            'content'         => $reply,
            'organization_id' => $args['organizationId'],
            'role'            => 'assistant',
            'thread_id'       => $thread->id,
            'user_id'         => $user->id,
        ]);

        // Return the newly created thread as the response
        return $thread;
    }
}
