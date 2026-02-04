<?php

declare(strict_types=1);

namespace App\Actions\Contacts;

use App\Models\Contact;

final class DeleteContactAction
{
    public function handle(Contact $contact): bool
    {
        return $contact->delete();
    }
}


