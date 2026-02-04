<?php

declare(strict_types=1);

namespace App\GraphQL\Mutations;

use App\Actions\Contacts\CreateContactAction;
use App\DataTransferObjects\ContactData;
use App\Models\Contact;
use GraphQL\Error\Error;
use Illuminate\Support\Facades\Auth;

final readonly class CreateContactMutation
{
    public function __construct(
        private readonly CreateContactAction $createContactAction,
    ) {
    }

    public function __invoke($_, array $args): Contact
    {
        try {
            $user = Auth::user();
            if (! $user) {
                throw new Error('No user found');
            }

            // Use authenticated user's ID
            $userId = $user->id;

            // Convert settings array of key-value pairs to associative array
            $settings = [];
            if (isset($args['settings']) && is_array($args['settings'])) {
                foreach ($args['settings'] as $entry) {
                    if (isset($entry['key']) && isset($entry['value'])) {
                        $settings[$entry['key']] = $entry['value'];
                    }
                }
            }

            $data = new ContactData(
                name: $args['name'],
                email: $args['email']                               ?? null,
                alt_email: $args['alt_email']                       ?? null,
                telephone_number: $args['telephone_number']         ?? null,
                alt_telephone_number: $args['alt_telephone_number'] ?? null,
                settings: $settings,
                details: $args['details'] ?? null,
                user_id: $userId,
            );

            return $this->createContactAction->handle($data);
        } catch (\Exception $e) {
            throw new Error('Failed to create contact: '.$e->getMessage());
        }
    }
}
