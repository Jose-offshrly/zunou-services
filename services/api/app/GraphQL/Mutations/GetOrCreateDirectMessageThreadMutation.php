<?php

declare(strict_types=1);

namespace App\GraphQL\Mutations;

use App\Models\DirectMessageThread;
use App\Models\User;
use GraphQL\Error\Error;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

final readonly class GetOrCreateDirectMessageThreadMutation
{
    /**
     * Handle the GraphQL mutation to get or create a direct message thread.
     *
     * Expected input fields in $args:
     * - input: {
     *       receiverId: The ID of the user to message.
     *       organizationId: The ID of the organization.
     *       page: The page number for pagination.
     *   }
     *
     * @param null $_
     * @param array $args
     * @return array{data: array, paginatorInfo: array, threadId: string}
     * @throws Error if validation fails, user is not authenticated, or receiver is not found.
     */
    public function __invoke(null $_, array $args)
    {
        // Extract the input values.
        \Log::info('testing logs');
        \Log::info('GetOrCreateDirectMessageThreadMutation args', [
            'args' => $args,
        ]);
        $input = $args['input'] ?? [];
        // Validate the input using Laravel validator.
        // $this->validateInput($input);

        $receiverId     = $input['receiverId'];
        $organizationId = $input['organizationId'];
        $page           = $input['page'] ?? 1;
        $perPage        = 10;

        // Retrieve the authenticated (current) user.
        $user = Auth::user();
        if (! $user) {
            throw new Error('User not authenticated.');
        }

        // Validate that the receiver exists.
        $receiver = User::find($receiverId);
        if (! $receiver) {
            throw new Error('Receiver not found.');
        }

        // Look up an existing direct message thread containing both users.
        $thread = DirectMessageThread::where('organization_id', $organizationId)
            ->whereJsonContains('participants', $user->id)
            ->whereJsonContains('participants', $receiver->id)
            ->first();

        if (! $thread) {
            // Create a new thread for the two participants.
            $thread = DirectMessageThread::create([
                'organization_id' => $organizationId,
                'participants'    => [$user->id, $receiver->id],
            ]);
        }

        // Get paginated messages
        $messages = $thread
            ->directMessages()
            ->withTrashed()
            ->orderBy('created_at', 'desc')
            ->paginate($perPage, ['*'], 'page', $page);

        return [
            'threadId'      => $thread->id,
            'data'          => $messages->items(),
            'paginatorInfo' => [
                'count'        => $messages->count(),
                'currentPage'  => $messages->currentPage(),
                'hasMorePages' => $messages->hasMorePages(),
                'lastPage'     => $messages->lastPage(),
                'perPage'      => $messages->perPage(),
                'total'        => $messages->total(),
            ],
        ];
    }

    /**
     * Validates the input array.
     *
     * @param array $input
     * @throws Error if validation fails.
     */
    private function validateInput(array $input): void
    {
        $validator = Validator::make($input, [
            'receiverId'     => 'required|string',
            'organizationId' => 'required|string',
            'page'           => 'integer|min:1',
        ]);

        if ($validator->fails()) {
            throw new Error($validator->errors()->first());
        }
    }
}
