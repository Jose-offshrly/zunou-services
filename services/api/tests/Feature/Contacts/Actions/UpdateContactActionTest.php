<?php

namespace Tests\Feature\Contacts\Actions;

use App\Actions\Contacts\UpdateContactAction;
use App\DataTransferObjects\UpdateContactData;
use App\Models\Contact;
use Tests\TestCase;

class UpdateContactActionTest extends TestCase
{
    public function test_it_can_patch_a_contact(): void
    {
        $contact = Contact::factory()->create([
            'name'                 => 'John Doe',
            'email'                => 'john@example.com',
            'alt_email'            => 'john.alt@example.com',
            'telephone_number'     => '+1-555-0000',
            'alt_telephone_number' => '+1-555-0001',
            'settings'             => ['notifications' => true],
            'details'              => 'Original details',
        ]);

        // Only update a subset of fields (patch-style)
        $data = new UpdateContactData(
            name: 'John Updated',
            details: 'Updated details',
        );

        $action = app(UpdateContactAction::class);

        $updated = $action->handle($contact, $data);

        $this->assertInstanceOf(Contact::class, $updated);
        $this->assertEquals('John Updated', $updated->name);
        $this->assertEquals('Updated details', $updated->details);
        // Unchanged fields remain the same
        $this->assertEquals('john@example.com', $updated->email);
        $this->assertEquals('+1-555-0000', $updated->telephone_number);
    }
}


