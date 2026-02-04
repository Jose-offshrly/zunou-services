<?php

declare(strict_types=1);

namespace App\GraphQL\Mutations;

use App\Events\DirectMessageDeleted;
use App\Models\DirectMessage;
use GraphQL\Error\Error;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Support\Facades\Auth;

final readonly class DeleteDirectMessageMutation
{
    /** @param  array{}  $args */
    public function __invoke(null $_, array $args)
    {
        try {
            $user = Auth::user();

            if (! $user) {
                throw new Error('No user was found');
            }

            try {
                $directMessage = DirectMessage::findOrFail(
                    $args['directMessageId'],
                );
            } catch (ModelNotFoundException $e) {
                throw new Error(
                    'Direct message not found with ID: ' .
                        $args['directMessageId'],
                );
            }

            // Store message data and format dates
            $messageToReturn = array_merge($directMessage->toArray(), [
                'createdAt' => $directMessage->created_at,
                'updatedAt' => $directMessage->updated_at,
                'deletedAt' => $directMessage->deleted_at,
            ]);

            // Delete the message
            $directMessage->delete();

            // Dispatch event for real-time delete
            DirectMessageDeleted::dispatch($directMessage);

            // Return the message data
            return $messageToReturn;
        } catch (\Exception $e) {
            throw new Error(
                'Failed to delete the direct message: ' . $e->getMessage(),
            );
        }
    }
}
