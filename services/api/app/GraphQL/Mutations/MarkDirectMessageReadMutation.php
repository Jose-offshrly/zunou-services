<?php

declare(strict_types=1);

namespace App\GraphQL\Mutations;

use App\Models\DirectMessage;
use App\Models\DirectMessageRead;
use GraphQL\Error\Error;
use Illuminate\Support\Facades\Auth;

final readonly class MarkDirectMessageReadMutation
{
    public function __invoke(null $_, array $args): bool
    {
        try {
            $user = Auth::user();
            if (! $user) {
                throw new Error('User not authenticated.');
            }

            $directMessage = DirectMessage::findOrFail(
                $args['input']['directMessageId'],
            );

            // Don't create a read record for the sender
            if ($directMessage->sender_id === $user->id) {
                return true;
            }

            // Check if already read
            $existingRead = DirectMessageRead::where(
                'direct_message_id',
                $directMessage->id,
            )
                ->where('user_id', $user->id)
                ->first();

            if ($existingRead) {
                return true;
            }

            // Create read record
            DirectMessageRead::create([
                'direct_message_id' => $directMessage->id,
                'user_id'           => $user->id,
            ]);

            return true;
        } catch (\Exception $e) {
            throw new Error(
                'Failed to mark message as read: ' . $e->getMessage(),
            );
        }
    }
}
