<?php

declare(strict_types=1);

namespace App\GraphQL\Mutations;

use App\Actions\Contacts\UpdateContactAction;
use App\DataTransferObjects\UpdateContactData;
use App\Models\Contact;
use GraphQL\Error\Error;
use Illuminate\Support\Facades\Auth;

final readonly class UpdateContactMutation
{
    public function __construct(
        private readonly UpdateContactAction $updateContactAction,
    ) {
    }

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
                throw new Error('You do not have permission to update this contact');
            }

            // Convert settings array of key-value pairs to associative array if provided
            $settings = null;
            if (isset($args['settings']) && is_array($args['settings'])) {
                $settings = [];
                foreach ($args['settings'] as $entry) {
                    if (isset($entry['key']) && isset($entry['value'])) {
                        $settings[$entry['key']] = $entry['value'];
                    }
                }
            }

            $data = new UpdateContactData(
                name: $args['name'] ?? null,
                email: $args['email'] ?? null,
                alt_email: $args['alt_email'] ?? null,
                telephone_number: $args['telephone_number'] ?? null,
                alt_telephone_number: $args['alt_telephone_number'] ?? null,
                settings: $settings,
                details: $args['details'] ?? null,
            );

            return $this->updateContactAction->handle($contact, $data);
        } catch (\Exception $e) {
            throw new Error('Failed to update contact: ' . $e->getMessage());
        }
    }
}

