<?php

declare(strict_types=1);

namespace App\Actions\Contacts;

use App\DataTransferObjects\ContactData;
use App\Models\Contact;

final class CreateContactAction
{
    public function handle(ContactData $data): Contact
    {
        $contact = Contact::create([
            'name'                 => $data->name,
            'email'                => $data->email,
            'alt_email'            => $data->alt_email,
            'telephone_number'     => $data->telephone_number,
            'alt_telephone_number' => $data->alt_telephone_number,
            'settings'             => $data->settings,
            'details'              => $data->details,
        ]);

        if ($data->user_id !== null) {
            $contact->owners()->attach($data->user_id);
        }

        return $contact->refresh();
    }

}
