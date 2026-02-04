<?php

declare(strict_types=1);

namespace App\GraphQL\Mutations;

use App\Models\Contact;
use App\Models\User;
use GraphQL\Error\Error;
use Illuminate\Support\Facades\Auth;

final readonly class AttachContactToUserMutation
{
    public function __invoke($_, array $args): Contact
    {
        try {
            $user = Auth::user();
            if (! $user) {
                throw new Error('No user found');
            }

            $contact = Contact::find($args['contactId']);
            if (! $contact) {
                throw new Error('Contact not found');
            }

            $targetUserId = $args['userId'];
            $targetUser = User::find($targetUserId);
            if (! $targetUser) {
                throw new Error('User not found');
            }

            // Verify the contact belongs to the authenticated user (or they have permission)
            if (! $contact->owners()->where('users.id', $user->id)->exists()) {
                throw new Error('You do not have permission to attach this contact');
            }

            // Attach the contact to the target user (won't duplicate if already attached)
            $contact->owners()->syncWithoutDetaching([$targetUserId]);

            return $contact->refresh()->load('owners');
        } catch (\Exception $e) {
            throw new Error('Failed to attach contact to user: ' . $e->getMessage());
        }
    }
}

