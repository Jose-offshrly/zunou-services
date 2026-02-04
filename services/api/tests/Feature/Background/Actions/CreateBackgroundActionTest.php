<?php

namespace Tests\Feature\Background\Actions;

use App\Actions\Background\CreateBackgroundAction;
use App\DataTransferObjects\BackgroundData;
use App\DataTransferObjects\FileData;
use App\Models\Background;
use App\Models\Organization;
use App\Models\User;
use Tests\TestCase;

class CreateBackgroundActionTest extends TestCase
{
    public function test_it_can_create_a_background_resource(): void
    {
        $user         = User::first();
        $organization = Organization::first();

        $file = new FileData(
            file_key: 'path/to/file/here',
            file_name: 'here.jpg',
        );

        $data = new BackgroundData(
            file: $file,
            active: true,
            user_id: $user->id,
            organization_id: $organization->id,
        );

        $action = app(CreateBackgroundAction::class);

        $background = $action->handle(data: $data);

        $this->assertInstanceOf(Background::class, $background);
        $this->assertNotNull($background->metadata);
        $this->assertTrue($background->active);
        $this->assertInstanceOf(User::class, $background->user);
        $this->assertInstanceOf(Organization::class, $background->organization);
    }
}
