<?php

namespace App\Policies;

use App\Models\Contact;
use App\Models\User;
use GraphQL\Error\Error;

class ContactPolicy extends AbstractPolicy
{
    /**
     * Determine whether the user can view any contacts.
     */
    public function viewAny(User $user, array $args): bool
    {
        return $user->hasPermission('read:contacts');
    }

    /**
     * Determine whether the user can view the contact.
     */
    public function view(User $user, array $args, ?Contact $contact = null): bool
    {
        $contact = $this->loadModel($user, $args, Contact::class, $contact);
        if (! $contact) {
            return throw new Error('Contact not found!');
        }

        // Check if the user is one of the owners
        if (! $contact->owners()->where('users.id', $user->id)->exists()) {
            return throw new Error('You are not allowed to view this contact!');
        }

        return $user->hasPermission('read:contacts');
    }

    /**
     * Determine whether the user can create contacts.
     */
    public function create(User $user, array $args): bool
    {
        return $user->hasPermission('create:contacts');
    }

    /**
     * Determine whether the user can update the contact.
     */
    public function update(User $user, array $args, ?Contact $contact = null): bool
    {
        $contact = $this->loadModel($user, $args, Contact::class, $contact);
        if (! $contact) {
            return throw new Error('Contact not found!');
        }

        // Check if the user is one of the owners
        if (! $contact->owners()->where('users.id', $user->id)->exists()) {
            return throw new Error('You are not allowed to update this contact!');
        }

        return $user->hasPermission('update:contacts');
    }

    /**
     * Determine whether the user can delete the contact.
     */
    public function delete(User $user, array $args, ?Contact $contact = null): bool
    {
        $contact = $this->loadModel($user, $args, Contact::class, $contact);
        if (! $contact) {
            return throw new Error('Contact not found!');
        }

        // Check if the user is one of the owners
        if (! $contact->owners()->where('users.id', $user->id)->exists()) {
            return throw new Error('You are not allowed to delete this contact!');
        }

        return $user->hasPermission('delete:contacts');
    }
}

