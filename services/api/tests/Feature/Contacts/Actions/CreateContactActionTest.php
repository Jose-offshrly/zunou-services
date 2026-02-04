<?php

namespace Tests\Feature\Contacts\Actions;

use App\Actions\Contacts\CreateContactAction;
use App\DataTransferObjects\ContactData;
use App\Models\Contact;
use App\Models\User;
use Tests\TestCase;

class CreateContactActionTest extends TestCase
{
    public function test_it_can_create_a_contact(): void
    {
        $user = User::factory()->create();

        $data = new ContactData(
            name: 'John Doe',
            email: 'john@example.com',
            alt_email: 'john.alt@example.com',
            telephone_number: '+1-555-0000',
            alt_telephone_number: '+1-555-0001',
            settings: ['notifications' => true],
            details: 'Test contact details',
            user_id: $user->id,
        );

        $action = app(CreateContactAction::class);

        $contact = $action->handle($data);

        $this->assertInstanceOf(Contact::class, $contact);
        $this->assertEquals('John Doe', $contact->name);
        $this->assertEquals('john@example.com', $contact->email);
        $this->assertEquals('john.alt@example.com', $contact->alt_email);
        $this->assertTrue($contact->owners->contains('id', $user->id));
    }
}



