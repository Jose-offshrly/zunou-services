<?php

declare(strict_types=1);

namespace App\GraphQL\Mutations;

use App\Actions\DirectMessage\CreateDirectMessageAction;
use App\DataTransferObjects\DirectMessageData;
use App\DataTransferObjects\FileData;
use App\Models\DirectMessage;
use App\Models\DirectMessageThread;
use GraphQL\Error\Error;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

final readonly class CreateDirectMessageMutation
{
    public function __construct(
        private CreateDirectMessageAction $createDirectMessageAction
    ) {
    }

    /**
     * Handle the GraphQL mutation to create a direct message.
     *
     * Expected input fields in $args:
     * - input: {
     *       directMessageThreadId: The ID of the direct message thread.
     *       content: The content to send.
     *   }
     *
     * @param null $_
     * @param array $args
     * @return DirectMessage
     * @throws Error if validation fails, user is not authenticated, thread is not found, or user is not a participant.
     */
    public function __invoke(null $_, array $args): DirectMessage
    {
        try {
            // Extract input data from $args.
            $input = $args['input'] ?? [];

            // Validate input data.
            $this->validateInput($input);

            $threadId = $input['directMessageThreadId'];
            $content = $input['content'];

            // Get the authenticated user.
            $user = Auth::user();
            if (!$user) {
                throw new Error('User not authenticated.');
            }

            // Retrieve the direct message thread.
            $thread = DirectMessageThread::find($threadId);
            if (!$thread) {
                throw new Error('Direct message thread not found.');
            }

            // Ensure the user is a participant in the thread.
            if (!in_array($user->id, $thread->participants)) {
                throw new Error('User is not a participant in this thread.');
            }

            return $this->createDirectMessage($input, $user->id);
        } catch (\Exception $e) {
            throw new Error(
                'Failed to create a direct message: ' . $e->getMessage()
            );
        }
    }

    private function createDirectMessage(
        array $input,
        string $userId
    ): DirectMessage {
        $files = null;
        if (isset($input['files']) && is_array($input['files'])) {
            $files = array_map(function ($file) {
                return FileData::from([
                    'file_key' => $file['fileKey'],
                    'file_name' => $file['fileName'],
                ]);
            }, $input['files']);
        }

        $data = new DirectMessageData(
            direct_message_thread_id: $input['directMessageThreadId'],
            sender_id: $userId,
            content: $input['content'],
            files: $files,
            replied_to_message_id: $input['repliedToMessageId'] ?? null
        );

        // Pass original files input with type to the action
        return $this->createDirectMessageAction->handle($data, $input['files'] ?? null);
    }

    /**
     * Validates the input array using Laravel's Validator.
     *
     * @param array $input
     * @throws Error if validation fails.
     */
    private function validateInput(array $input): void
    {
        $validator = Validator::make($input, [
            'directMessageThreadId' =>
                'required|string|exists:direct_message_threads,id',
            'content' => 'required|string',
            'repliedToMessageId' => 'nullable|string|exists:direct_messages,id',
        ]);

        if ($validator->fails()) {
            throw new Error($validator->errors()->first());
        }
    }
}
