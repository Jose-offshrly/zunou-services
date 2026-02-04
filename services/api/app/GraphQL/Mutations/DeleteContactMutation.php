<?php

declare(strict_types=1);

namespace App\GraphQL\Mutations;

use App\Models\Contact;
use GraphQL\Error\Error;
use Illuminate\Support\Facades\Auth;

final readonly class DeleteContactMutation
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

            // Verify the contact belongs to the authenticated user
            if (! $contact->owners()->where('users.id', $user->id)->exists()) {
                throw new Error('You do not have permission to delete this contact');
            }

            // Count how many owners the contact has
            $ownerCount = $contact->owners()->count();

            // Detach the current user from the contact
            $contact->owners()->detach($user->id);

            // If this was the only owner, soft delete the contact
            if ($ownerCount === 1) {
                $contact->delete();
            }

            return $contact->refresh()->load('owners');
        } catch (\Exception $e) {
            throw new Error('Failed to delete contact: ' . $e->getMessage());
        }
    }
}

