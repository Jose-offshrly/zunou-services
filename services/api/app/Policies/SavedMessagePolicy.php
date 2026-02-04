<?php

namespace App\Policies;

use App\Models\Pulse;
use App\Models\SavedMessage;
use App\Models\User;
use GraphQL\Error\Error;

class SavedMessagePolicy extends AbstractPolicy
{
    /**
     * Determine whether the user can view a specific saved message.
     */
    public function view(
        User $user,
        array $args,
        ?SavedMessage $savedMessage = null,
    ): bool {
        $savedMessage = $this->loadModel(
            $user,
            $args,
            SavedMessage::class,
            $savedMessage,
        );

        if (! $savedMessage) {
            return false;
        }

        return $user->id === $savedMessage->user_id && $user->hasPermission('read:saved-messages');
    }

    /**
     * Determine whether the user can create saved messages.
     */
    public function create(User $user, array $args): bool
    {
        $this->checkPulseMembership(user: $user, args: $args['input'], model: Pulse::class);

        return $user->hasPermission('create:saved-messages') && $user->hasOrganization($args['input']['organization_id']);
    }

    public function delete(
        User $user,
        array $args,
        ?SavedMessage $savedMessage = null,
    ): bool {
        $savedMessage = $this->loadModel(
            $user,
            $args,
            SavedMessage::class,
            $savedMessage,
        );
        if (! $savedMessage) {
            throw new Error('SavedMessage resource not found');
        }

        return $savedMessage->user_id === $user->id && $user->hasPermission('delete:saved-messages');
    }
}
