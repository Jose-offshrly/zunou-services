<?php

namespace Feature\OrganizationUser\Actions;

use App\Actions\OrganizationUser\DeleteOrganizationUserAction;
use App\Models\OrganizationUser;
use Tests\TestCase;

class DeleteOrganizationUserActionTest extends TestCase
{
    public function test_it_can_delete_an_organization_user_resource()
    {
        $organizationUser = OrganizationUser::factory()->create();

        $action = app(DeleteOrganizationUserAction::class);

        $removed = $action->handle($organizationUser);

        $this->assertTrue($removed);
    }
}
