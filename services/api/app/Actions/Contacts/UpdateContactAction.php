<?php

declare(strict_types=1);

namespace App\Actions\Contacts;

use App\DataTransferObjects\UpdateContactData;
use App\Models\Contact;

final class UpdateContactAction
{
    public function handle(Contact $contact, UpdateContactData $data): Contact
    {
        // Handle settings merge - if settings are provided, merge with existing
        $settings = $data->settings;
        if ($settings !== null) {
            $existingSettings = $contact->settings ?? [];
            $settings = array_merge($existingSettings, $settings);
        }

        $attributes = array_filter([
            'name'                 => $data->name,
            'email'                => $data->email,
            'alt_email'            => $data->alt_email,
            'telephone_number'     => $data->telephone_number,
            'alt_telephone_number' => $data->alt_telephone_number,
            'settings'             => $settings,
            'details'              => $data->details,
        ], static fn ($value) => $value !== null);

        if ($attributes !== []) {
            $contact->update($attributes);
        }

        return $contact->refresh();
    }
}


