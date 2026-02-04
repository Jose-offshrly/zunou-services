<?php

declare(strict_types=1);

namespace Tests\Feature\OrganizationGroup;

use App\Actions\OrganizationGroup\CreateOrganizationGroupAction;
use App\DataTransferObjects\OrganizationGroupData;
use App\Models\Organization;
use App\Models\OrganizationGroup;
use App\Models\Pulse;
use Tests\TestCase;

class CreateOrganizationGroupActionTest extends TestCase
{
    public function test_it_can_crate_an_organization_group(): void
    {
        $pulse        = Pulse::first();
        $organization = Organization::first();

        $data = new OrganizationGroupData(
            name: 'Group Name',
            description: 'description',
            pulse_id: $pulse->id,
            organization_id: $organization->id,
        );

        $action = app(CreateOrganizationGroupAction::class);

        $group = $action->handle(data: $data);

        $this->assertInstanceOf(OrganizationGroup::class, $group);
        $this->assertEquals('Group Name', $group->name);
        $this->assertEquals('description', $group->description);
        $this->assertInstanceOf(Pulse::class, $group->pulse);
        $this->assertInstanceOf(Organization::class, $group->organization);
    }
}
