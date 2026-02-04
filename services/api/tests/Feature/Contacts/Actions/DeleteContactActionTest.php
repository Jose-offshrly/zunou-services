<?php

namespace Tests\Feature\Contacts\Actions;

use App\Actions\Contacts\DeleteContactAction;
use App\Models\Contact;
use Tests\TestCase;

class DeleteContactActionTest extends TestCase
{
    public function test_it_can_delete_a_contact(): void
    {
        $contact = Contact::factory()->create();

        $action = app(DeleteContactAction::class);

        $result = $action->handle($contact);

        $this->assertTrue($result);
        $this->assertSoftDeleted('contacts', ['id' => $contact->id]);
    }
}


